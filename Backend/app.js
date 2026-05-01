const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const supabase = require("./db");
const session = require("express-session");
const schema = require("./schema");
const schema2 = require("./schema2");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
console.log("URL:", process.env.SUPABASE_URL);
// Configuration
const MAX_SESSION_AGE = 60 * 60 * 1000; // 1 hour
const MAX_RESULT_ROWS = 10000;
const MAX_QUERY_LENGTH = 10000;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 30000; // 30 seconds
app.get("/", (req, res) => {
  res.send("Server working");
});
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    secret: "sql-sandbox-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    rolling: true,
  }),
);

const sessionDBs = new Map();
const sessionLastAccess = new Map();

app.use((req, res, next) => {
  if (req.session && req.session.id) {
    sessionLastAccess.set(req.session.id, Date.now());
  }
  next();
});
app.post("/check-verification", async (req, res) => {
  const { id } = req.body;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(id);

    if (error) {
      return res.status(500).json({ verified: false });
    }

    const user = data.user;

    res.json({
      verified: !!user.email_confirmed_at,
    });
  } catch (err) {
    res.status(500).json({ verified: false });
  }
});
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log("Incoming:", { name, email, password });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("Supabase response:", data);
    console.log("Supabase error:", error);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = data.user;

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: user.id,
        name,
        email,
      },
    ]);

    console.log("Insert error:", insertError);

    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }

    res.json({
      message: "Signup successful",
      user: {
        id: user.id,
        name,
        email,
      },
      needsVerification: true,
    });
  } catch (err) {
    console.error("🔥 FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔐 Auth login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = data.user;

    // 🗂️ Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json(profileError);
    }

    // 🔥 Fetch progress
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("*")
      .eq("id", user.id);

    if (progressError) {
      return res.status(500).json(progressError);
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || "Unknown",
      },
      progress: progress || [], // 🔥 send progress
      session: data.session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, lastAccess] of sessionLastAccess.entries()) {
    if (now - lastAccess > MAX_SESSION_AGE) {
      const db = sessionDBs.get(sessionId);
      if (db) {
        db.close((err) => {
          if (err)
            console.error(`Error closing DB for session ${sessionId}:`, err);
          else console.log(`Cleaned up session ${sessionId}`);
        });
        sessionDBs.delete(sessionId);
      }
      sessionLastAccess.delete(sessionId);
    }
  }
}, CLEANUP_INTERVAL);

app.get("/check-session", (req, res) => {
  res.json({
    sessionId: req.session.id,
    lastAccess: sessionLastAccess.get(req.session.id),
  });
});

async function createSandboxDB(sessionId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(":memory:");
    db.serialize(async () => {
      try {
        for (let i = 0; i < schema.length; i++) {
          await new Promise((res, rej) => {
            db.run(schema[i], (err) => {
              if (err) {
                console.error(
                  `[Session ${sessionId}] Error in schema query ${i}:`,
                  err.message,
                );
                return rej(err);
              }
              console.log(
                `[Session ${sessionId}] ✓ Schema query ${i} executed`,
              );
              res();
            });
          });
        }
        resolve(db);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function removeStringLiterals(sql) {
  let result = "";
  let inString = false;
  let stringChar = "";
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    if (inString && char === stringChar && sql[i - 1] !== "\\") {
      inString = false;
      result += char;
      i++;
      continue;
    }

    if (inString) {
      result += " ";
    } else {
      result += char;
    }
    i++;
  }

  return result;
}

function removeIdentifiers(sql) {
  let result = sql.replace(/`[^`]*`/g, "``");
  result = result.replace(/\[[^\]]*\]/g, "[]");
  result = result.replace(/"[^"]*"/g, '""');
  return result;
}

function removeCommentsSafe(sql) {
  let result = "";
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < sql.length) {
    if (
      !inBlockComment &&
      !inLineComment &&
      sql[i] === "-" &&
      sql[i + 1] === "-"
    ) {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (
      !inBlockComment &&
      !inLineComment &&
      sql[i] === "/" &&
      sql[i + 1] === "*"
    ) {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (inLineComment && (sql[i] === "\n" || sql[i] === "\r")) {
      inLineComment = false;
      result += " ";
      i++;
      continue;
    }

    if (inBlockComment && sql[i] === "*" && sql[i + 1] === "/") {
      inBlockComment = false;
      i += 2;
      continue;
    }

    if (!inLineComment && !inBlockComment) {
      result += sql[i];
    }
    i++;
  }

  return result;
}

function isDangerousSQL(query) {
  if (!query || typeof query !== "string") return true;

  let cleaned = removeStringLiterals(query);
  cleaned = removeIdentifiers(cleaned);
  cleaned = removeCommentsSafe(cleaned);

  const upperQuery = cleaned.toUpperCase();

  const dangerousKeywords = [
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "REPLACE",
    "ATTACH",
    "DETACH",
    "PRAGMA",
    "VACUUM",
    "REINDEX",
    "ANALYZE",
    "EXPLAIN",
    "SAVEPOINT",
    "RELEASE",
    "ROLLBACK",
    "COMMIT",
    "BEGIN",
    "GRANT",
    "REVOKE",
  ];

  for (const keyword of dangerousKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(upperQuery)) {
      console.log(`Dangerous keyword detected: ${keyword}`);
      return true;
    }
  }

  const statements = cleaned.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    console.log(`Multiple statements detected: ${statements.length}`);
    return true;
  }

  return false;
}

function isSafeQuery(query) {
  if (!query || typeof query !== "string") return false;
  if (query.length > MAX_QUERY_LENGTH) return false;

  if (isDangerousSQL(query)) {
    return false;
  }

  let trimmedQuery = query.trim();

  if (trimmedQuery.toUpperCase().match(/^WITH\s+(RECURSIVE\s+)?/i)) {
    const selectIndex = trimmedQuery.toUpperCase().indexOf("SELECT");
    if (selectIndex === -1) {
      return false;
    }
    return true;
  }

  if (!trimmedQuery.toUpperCase().startsWith("SELECT")) {
    return false;
  }

  return true;
}

function removeSubqueries(sql) {
  const subqueries = [];
  let counter = 0;
  let result = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inSubquery = false;
  let subqueryStart = -1;
  let i = 0;
  let maxIterations = sql.length * 2;
  let iterations = 0;

  while (i < sql.length && iterations < maxIterations) {
    iterations++;
    const char = sql[i];

    if ((char === "'" || char === '"') && sql[i - 1] !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      result += char;
      i++;
      continue;
    }

    if (!inString && char === "(") {
      if (!inSubquery) {
        let j = i + 1;
        let foundSelect = false;
        let tempDepth = 1;
        let inSubString = false;
        let subStringChar = "";
        let maxJ = Math.min(i + 5000, sql.length);

        while (j < maxJ && tempDepth > 0) {
          const c = sql[j];

          if ((c === "'" || c === '"') && sql[j - 1] !== "\\") {
            if (!inSubString) {
              inSubString = true;
              subStringChar = c;
            } else if (c === subStringChar) {
              inSubString = false;
            }
          }

          if (!inSubString) {
            if (c === "(") tempDepth++;
            if (c === ")") tempDepth--;
            if (
              tempDepth === 1 &&
              sql.slice(j, Math.min(j + 6, sql.length)).toUpperCase() ===
                "SELECT"
            ) {
              foundSelect = true;
              break;
            }
          }
          j++;
        }

        if (foundSelect) {
          inSubquery = true;
          subqueryStart = i;
          i++;
          continue;
        }
      }
    }

    if (inSubquery) {
      if (char === "(") depth++;
      if (char === ")") {
        if (depth === 0) {
          const subquery = sql.substring(subqueryStart, i + 1);
          const placeholder = `__SUBQUERY_${counter}__`;
          subqueries.push(subquery);
          result += placeholder;
          inSubquery = false;
          depth = 0;
          i++;
          counter++;
          continue;
        }
        depth--;
      }
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return { cleaned: result, subqueries };
}

function removeCTEs(sql) {
  let result = sql;
  const ctePattern = /WITH\s+(?:RECURSIVE\s+)?(\w+)\s+AS\s*\([^)]*\)\s*,?\s*/gi;
  let match;
  const ctes = [];

  while ((match = ctePattern.exec(sql)) !== null) {
    ctes.push(match[0]);
  }

  for (const cte of ctes) {
    result = result.replace(cte, "");
  }

  if (ctes.length > 0) {
    result = result.replace(/^WITH\s+/i, "");
  }

  return { cleaned: result, ctes };
}

function extractSelectClause(query) {
  try {
    let { cleaned: withoutCTE } = removeCTEs(query);
    const { cleaned, subqueries } = removeSubqueries(withoutCTE);

    const unionIndex = cleaned
      .toUpperCase()
      .search(/\b(UNION|INTERSECT|EXCEPT)\b/);
    let mainSelect =
      unionIndex !== -1 ? cleaned.substring(0, unionIndex) : cleaned;

    let depth = 0;
    let inString = false;
    let inComment = false;
    let fromIndex = -1;

    for (let i = 0; i < mainSelect.length; i++) {
      const char = mainSelect[i];
      const nextTwo = mainSelect.slice(i, i + 2);

      if (!inString && nextTwo === "--") {
        inComment = true;
        i++;
        continue;
      }
      if (!inString && nextTwo === "/*") {
        inComment = true;
        i++;
        continue;
      }
      if (inComment && (nextTwo === "*/" || char === "\n")) {
        inComment = false;
        if (nextTwo === "*/") i++;
        continue;
      }

      if (inComment) continue;

      if ((char === "'" || char === '"') && mainSelect[i - 1] !== "\\") {
        inString = !inString;
      }

      if (!inString) {
        if (char === "(") depth++;
        if (char === ")") depth--;

        if (
          depth === 0 &&
          mainSelect
            .slice(i, Math.min(i + 4, mainSelect.length))
            .toLowerCase() === "from"
        ) {
          fromIndex = i;
          break;
        }
      }
    }

    if (fromIndex === -1) return null;

    const selectStart = mainSelect.toLowerCase().indexOf("select");
    if (selectStart === -1) return null;

    let selectClause = mainSelect.substring(selectStart + 6, fromIndex).trim();

    if (selectClause.toUpperCase().startsWith("DISTINCT")) {
      selectClause = selectClause.substring(8).trim();
    }

    if (selectClause.toUpperCase().startsWith("ALL")) {
      selectClause = selectClause.substring(3).trim();
    }

    subqueries.forEach((subq, idx) => {
      const placeholder = new RegExp(`__SUBQUERY_${idx}__`, "g");
      selectClause = selectClause.replace(placeholder, subq);
    });

    return selectClause;
  } catch (err) {
    console.error("Error extracting select clause:", err);
    return null;
  }
}

function parseColumnsWithNesting(selectClause) {
  const columns = [];
  let current = "";
  let parenDepth = 0;
  let inString = false;
  let stringChar = "";
  let inComment = false;
  let inCase = false;
  let caseDepth = 0;

  for (let i = 0; i < selectClause.length; i++) {
    const char = selectClause[i];
    const nextTwo = selectClause.slice(i, i + 2);
    const nextSix = selectClause.slice(i, i + 6).toUpperCase();

    if (!inString && nextSix === "CASE WHEN") {
      inCase = true;
      caseDepth++;
    }
    if (inCase && nextSix === "END") {
      caseDepth--;
      if (caseDepth === 0) inCase = false;
    }

    if (!inString && nextTwo === "--") {
      inComment = true;
      i++;
      continue;
    }
    if (!inString && nextTwo === "/*") {
      inComment = true;
      i++;
      continue;
    }
    if (inComment && (nextTwo === "*/" || char === "\n")) {
      inComment = false;
      if (nextTwo === "*/") i++;
      continue;
    }

    if (inComment) continue;

    if ((char === '"' || char === "'") && selectClause[i - 1] !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (char === "(" && !inCase) parenDepth++;
      if (char === ")" && !inCase) parenDepth--;

      if (char === "," && parenDepth === 0 && !inCase) {
        if (current.trim()) columns.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    columns.push(current.trim());
  }

  return columns;
}

function normalizeColumnNameForComparison(col, toLower = true) {
  let name = col.split(".").pop();
  name = name.replace(/^["'`\[]|["'`\]]$/g, "");
  name = name.replace(/[()*]/g, "");
  return toLower ? name.toLowerCase().trim() : name.trim();
}

function getOuterSelectAliasMap(query) {
  const aliasMap = {};

  const selectClause = extractSelectClause(query);
  if (!selectClause) return aliasMap;

  const columns = parseColumnsWithNesting(selectClause);

  for (let col of columns) {
    const asMatch = col.match(/(.+?)\s+AS\s+([^\s,]+)/i);
    if (asMatch) {
      let originalExpr = asMatch[1].trim();
      const alias = asMatch[2].trim();

      if (!originalExpr.includes(" ") && !originalExpr.includes("(")) {
        const parts = originalExpr.split(".");
        if (parts.length > 1) {
          originalExpr = parts[parts.length - 1];
        }
      }
      originalExpr = originalExpr.replace(/^["'`\[]|["'`\]]$/g, "");

      aliasMap[originalExpr.toLowerCase()] = alias;
      continue;
    }

    const funcMatch = col.match(/^([A-Z_]+\(.*\))$/i);
    if (funcMatch) {
      const func = funcMatch[1];
      aliasMap[func.toLowerCase()] = func;
      continue;
    }

    if (col.toUpperCase().includes("CASE")) {
      const caseMatch = col.match(/CASE\s+.*?\s+END\s+(\w+)/i);
      if (caseMatch) {
        aliasMap["case_expression"] = caseMatch[1];
      }
      continue;
    }

    const parts = col.trim().split(/\s+/);
    if (parts.length >= 2) {
      const possibleAlias = parts[parts.length - 1];
      const expression = parts.slice(0, -1).join(" ");

      const keywords = [
        "FROM",
        "WHERE",
        "GROUP",
        "ORDER",
        "HAVING",
        "LIMIT",
        "OFFSET",
        "UNION",
        "INTERSECT",
        "EXCEPT",
      ];
      if (!keywords.includes(possibleAlias.toUpperCase())) {
        let originalExpr = expression.trim();

        if (!originalExpr.includes(" ") && !originalExpr.includes("(")) {
          const dotParts = originalExpr.split(".");
          if (dotParts.length > 1) {
            originalExpr = dotParts[dotParts.length - 1];
          }
        }
        originalExpr = originalExpr.replace(/^["'`\[]|["'`\]]$/g, "");

        aliasMap[originalExpr.toLowerCase()] = possibleAlias;
      }
    }
  }

  return aliasMap;
}

function applyAliasMapToResult(result, aliasMap) {
  if (!result.length) return result;

  const reverseMap = {};
  for (let original in aliasMap) {
    const alias = aliasMap[original];
    reverseMap[alias.toLowerCase()] = original;
    reverseMap[alias] = original;
  }

  return result.map((row) => {
    const newRow = {};
    for (let col in row) {
      const colLower = col.toLowerCase();
      if (reverseMap[colLower]) {
        newRow[reverseMap[colLower]] = row[col];
      } else {
        newRow[col] = row[col];
      }
    }
    return newRow;
  });
}

function runQuery(db, query) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Query timeout after 30 seconds"));
    }, REQUEST_TIMEOUT);

    if (!isSafeQuery(query)) {
      clearTimeout(timeout);
      reject(new Error("Query rejected: Only SELECT statements are allowed"));
      return;
    }

    let safeQuery = query;
    const hasLimit = query.toLowerCase().includes("limit");
    const hasAggregate = query
      .toLowerCase()
      .match(/\b(count|sum|avg|min|max)\b/i);

    if (!hasLimit && !hasAggregate) {
      safeQuery = `${query} LIMIT ${MAX_RESULT_ROWS}`;
    }

    db.all(safeQuery, [], (err, rows) => {
      clearTimeout(timeout);
      if (err) return reject(err);
      if (rows.length > MAX_RESULT_ROWS) {
        rows = rows.slice(0, MAX_RESULT_ROWS);
      }
      resolve(rows);
    });
  });
}

function hasOuterOrderBy(query) {
  try {
    let { cleaned } = removeSubqueries(query);
    cleaned = removeCTEs(cleaned).cleaned;

    let depth = 0;
    let inString = false;
    let i = 0;
    const q = cleaned.toLowerCase();

    while (i < q.length) {
      if (q[i] === "'" || q[i] === '"') {
        const quoteChar = q[i];
        i++;
        while (i < q.length && q[i] !== quoteChar) i++;
        i++;
        continue;
      }

      if (q[i] === "(") depth++;
      if (q[i] === ")") depth--;

      if (depth === 0) {
        const orderByIndex = q.slice(i).search(/\border by\b/i);
        if (orderByIndex !== -1) {
          const remaining = q.slice(i + orderByIndex);
          if (!remaining.match(/\b(union|intersect|except)\b/i)) {
            return true;
          }
        }
      }

      i++;
    }
    return false;
  } catch (err) {
    return false;
  }
}

function hasLimitOrOffset(query) {
  try {
    let { cleaned } = removeSubqueries(query);
    cleaned = removeCTEs(cleaned).cleaned;

    let depth = 0;
    let inString = false;
    let i = 0;
    const q = cleaned.toLowerCase();

    while (i < q.length) {
      if (q[i] === "'" || q[i] === '"') {
        const quoteChar = q[i];
        i++;
        while (i < q.length && q[i] !== quoteChar) i++;
        i++;
        continue;
      }

      if (q[i] === "(") depth++;
      if (q[i] === ")") depth--;

      if (depth === 0) {
        if (q.slice(i, i + 5) === "limit") {
          const before = i > 0 ? q[i - 1] : " ";
          if (!/[a-z0-9_]/.test(before)) {
            return true;
          }
        }
        if (q.slice(i, i + 6) === "offset") {
          const before = i > 0 ? q[i - 1] : " ";
          if (!/[a-z0-9_]/.test(before)) {
            return true;
          }
        }
      }

      i++;
    }
    return false;
  } catch (err) {
    return false;
  }
}

function normalizeRow(row) {
  return Object.keys(row)
    .sort()
    .map((key) => {
      const val = row[key];
      if (val === null) return "NULL";
      if (typeof val === "number") {
        if (Number.isInteger(val)) return val;
        return Number(val.toFixed(10));
      }
      if (typeof val === "string") return val.trim();
      if (typeof val === "boolean") return val ? "true" : "false";
      if (val instanceof Buffer) return val.toString("hex");
      if (val instanceof Date) return val.toISOString();
      return String(val);
    });
}

function normalizeResult(rows, ignoreRowOrder) {
  let processed = rows
    .map((row) => normalizeRow(row))
    .map((arr) => JSON.stringify(arr));

  if (ignoreRowOrder) {
    processed.sort();
  }
  return processed;
}

function hasAllColumns(result1, result2) {
  if (!result1.length && !result2.length) return true;
  if (!result1.length && result2.length) return false;
  if (result1.length && !result2.length) return true;

  const cols1 = new Set(
    Object.keys(result1[0]).map((c) =>
      normalizeColumnNameForComparison(c, true),
    ),
  );
  const cols2 = Object.keys(result2[0]).map((c) =>
    normalizeColumnNameForComparison(c, true),
  );

  for (let col of cols2) {
    if (!cols1.has(col)) {
      console.log(`Missing column: ${col}`);
      return false;
    }
  }
  return true;
}

function hasNoExtraColumns(result1, result2) {
  if (!result1.length) return true;
  if (!result2.length) return false;

  const cols1 = new Set(
    Object.keys(result1[0]).map((c) =>
      normalizeColumnNameForComparison(c, true),
    ),
  );
  const cols2 = new Set(
    Object.keys(result2[0]).map((c) =>
      normalizeColumnNameForComparison(c, true),
    ),
  );

  for (let col of cols1) {
    if (!cols2.has(col)) {
      console.log(`Extra column: ${col}`);
      return false;
    }
  }
  return true;
}

function filterResultByColumns(result, referenceResult) {
  if (!result.length || !referenceResult.length) return result;

  const refColMap = {};
  Object.keys(referenceResult[0]).forEach((col) => {
    const normalized = normalizeColumnNameForComparison(col, true);
    if (!refColMap[normalized]) {
      refColMap[normalized] = col;
    }
  });

  return result.map((row) => {
    const newRow = {};
    for (let col in row) {
      const normalizedCol = normalizeColumnNameForComparison(col, true);
      if (refColMap[normalizedCol]) {
        newRow[refColMap[normalizedCol]] = row[col];
      }
    }
    return newRow;
  });
}

function areResultsEqual(res1, res2, ignoreRowOrder) {
  const norm1 = normalizeResult(res1, ignoreRowOrder);
  const norm2 = normalizeResult(res2, ignoreRowOrder);

  if (norm1.length !== norm2.length) return false;

  for (let i = 0; i < norm1.length; i++) {
    if (norm1[i] !== norm2[i]) return false;
  }
  return true;
}

async function compareQueries(db, userQuery, minimalQuery, maximalQuery) {
  try {
    if (
      !isSafeQuery(userQuery) ||
      !isSafeQuery(minimalQuery) ||
      !isSafeQuery(maximalQuery)
    ) {
      console.log("Unsafe query detected");
      return false;
    }

    let [userResult, minimalResult, maximalResult] = await Promise.all([
      runQuery(db, userQuery),
      runQuery(db, minimalQuery),
      runQuery(db, maximalQuery),
    ]);

    // Apply alias mapping to minimal and maximal queries too
    const minimalAliasMap = getOuterSelectAliasMap(minimalQuery);
    const maximalAliasMap = getOuterSelectAliasMap(maximalQuery);

    minimalResult = applyAliasMapToResult(minimalResult, minimalAliasMap);
    maximalResult = applyAliasMapToResult(maximalResult, maximalAliasMap);

    console.log(
      "User result columns:",
      userResult[0] ? Object.keys(userResult[0]) : [],
    );
    console.log(
      "Minimal result columns:",
      minimalResult[0] ? Object.keys(minimalResult[0]) : [],
    );
    console.log(
      "Maximal result columns:",
      maximalResult[0] ? Object.keys(maximalResult[0]) : [],
    );

    const aliasMap = getOuterSelectAliasMap(userQuery);
    console.log("Alias map:", aliasMap);

    userResult = applyAliasMapToResult(userResult, aliasMap);
    console.log(
      "After alias mapping:",
      userResult[0] ? Object.keys(userResult[0]) : [],
    );

    if (!hasAllColumns(userResult, minimalResult)) {
      console.log("Failed: Missing required columns from minimal answer");
      return false;
    }

    if (!hasNoExtraColumns(userResult, maximalResult)) {
      console.log("Failed: Has extra columns beyond maximal answer");
      return false;
    }

    const filteredUserResult = filterResultByColumns(userResult, minimalResult);

    const userHasOrder = hasOuterOrderBy(userQuery);
    const minimalHasOrder = hasOuterOrderBy(minimalQuery);
    const ignoreRowOrder = !(userHasOrder || minimalHasOrder);

    const userHasLimitWithoutOrder =
      hasLimitOrOffset(userQuery) && !userHasOrder;
    const minimalHasLimitWithoutOrder =
      hasLimitOrOffset(minimalQuery) && !minimalHasOrder;
    const finalIgnoreRowOrder =
      ignoreRowOrder || userHasLimitWithoutOrder || minimalHasLimitWithoutOrder;

    const dataEqual = areResultsEqual(
      filteredUserResult,
      minimalResult,
      finalIgnoreRowOrder,
    );

    if (!dataEqual) {
      console.log("Failed: Data mismatch");
      return false;
    }

    return userResult;
  } catch (err) {
    console.error("Error executing queries:", err.message);
    return false;
  }
}

// app.post("/signup", async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     db.query(
//       "SELECT * FROM users WHERE email = ?",
//       [email],
//       async (err, result) => {
//         if (result.length > 0) {
//           return res.status(400).json({ message: "User already exists" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         db.query(
//           "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
//           [name, email, hashedPassword],
//           (err, result) => {
//             if (err) return res.status(500).json(err);

//             // ✅ RETURN USER DATA
//             res.json({
//               message: "Signup successful",
//               user: {
//                 name,
//                 email,
//               },
//             });
//           },
//         );
//       },
//     );
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
// app.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   db.query(
//     "SELECT * FROM users WHERE email = ?",
//     [email],
//     async (err, result) => {
//       if (result.length === 0) {
//         return res.status(400).json({ message: "User not found" });
//       }
//       const user = result[0];
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Invalid password" });
//       }
//       res.json({ message: "Login successful", user });
//     },
//   );
// });
// app.post("/login", (req, res) => {
//   const { email, password } = req.body;

//   db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
//     if (err) return res.status(500).json({ message: "DB error" });

//     if (result.length === 0) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const user = result[0];

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     /* 🔥 CREATE TOKEN */
//     const token = jwt.sign(
//       { id: user.id, email: user.email }, // payload
//       JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     /* ✅ SEND TOKEN + USER */
//     res.json({
//       message: "Login successful",
//       token,
//       user,
//     });
//   });
// });

app.post("/req", async (req, res) => {
  const { query, minimalAnswer, maximalAnswer } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query required" });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(413).json({
      error: `Query too large. Maximum ${MAX_QUERY_LENGTH} characters allowed.`,
    });
  }

  if (!isSafeQuery(query)) {
    return res.status(403).json({
      error:
        "Only SELECT queries are allowed. No DDL, DML, or multiple statements permitted.",
    });
  }

  if (isDangerousSQL(query)) {
    return res.status(403).json({
      error: "Query contains dangerous SQL operations",
    });
  }

  try {
    let db = sessionDBs.get(req.session.id);
    if (!db) {
      db = await createSandboxDB(req.session.id);
      sessionDBs.set(req.session.id, db);
      sessionLastAccess.set(req.session.id, Date.now());
    }

    const result = await compareQueries(
      db,
      query,
      minimalAnswer,
      maximalAnswer,
    );

    if (!result) {
      return res.json({ rows: [], correct: false });
    }

    const limitedResult = result.slice(0, 1000);
    const isTruncated = result.length > 1000;

    return res.json({
      rows: limitedResult,
      correct: true,
      truncated: isTruncated,
      totalRows: result.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
});

app.post("/progress", async (req, res) => {
  const { id, type, question, solved } = req.body;

  console.log("Progress request:", { id, type, question, solved });

  // Always return success for frontend, even if Supabase fails
  let supabaseSuccess = true;

  try {
    // Try to save to Supabase (optional)
    if (id && type !== undefined && question) {
      // Check if record exists with same id, type, question
      const { data: existingData } = await supabase
        .from("progress")
        .select("*")
        .eq("id", id)
        .eq("type", type)
        .eq("question", question)
        .maybeSingle();

      if (existingData) {
        // Update existing
        await supabase
          .from("progress")
          .update({ solved: solved })
          .eq("id", id)
          .eq("type", type)
          .eq("question", question);
        console.log("Updated Supabase record");
      } else {
        // Insert new
        await supabase
          .from("progress")
          .insert([{ id, type, question, solved }]);
        console.log("Inserted new Supabase record");
      }
    }
  } catch (err) {
    console.error("Supabase error (non-critical):", err.message);
    supabaseSuccess = false;
  }

  // Always return success to frontend
  res.json({
    success: true,
    message: "Progress saved locally",
    supabaseUpdated: supabaseSuccess,
  });
});
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeSessions: sessionDBs.size,
    uptime: process.uptime(),
  });
});
// Add these endpoints to your server.js

// Cases mode - run query
app.post("/cases/run", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query required" });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(413).json({
      error: `Query too large. Maximum ${MAX_QUERY_LENGTH} characters allowed.`,
    });
  }

  if (!isSafeQuery(query)) {
    return res.status(403).json({
      error: "Only SELECT statements are allowed.",
    });
  }

  try {
    let db = sessionDBs.get(req.session.id);
    if (!db) {
      db = await createSandboxDBCases(req.session.id);
      sessionDBs.set(req.session.id, db);
      sessionLastAccess.set(req.session.id, Date.now());
    }

    const result = await runQuery(db, query);
    const limitedResult = result.slice(0, 1000);

    return res.json({
      rows: limitedResult,
      totalRows: result.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
});

// Cases mode - submit answer
app.post("/cases/submit", async (req, res) => {
  const { userAnswer, expectedAnswer, questionId } = req.body;

  // Case-insensitive comparison
  const isCorrect =
    userAnswer &&
    expectedAnswer &&
    userAnswer.trim().toLowerCase() === expectedAnswer.toLowerCase();

  return res.json({
    correct: isCorrect,
  });
});

// Create sandbox DB for Cases mode using schema2
async function createSandboxDBCases(sessionId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(":memory:");
    db.serialize(async () => {
      try {
        for (let i = 0; i < schema2.length; i++) {
          await new Promise((res, rej) => {
            db.run(schema2[i], (err) => {
              if (err) {
                console.error(
                  `[Session ${sessionId}] Error in schema2 query ${i}:`,
                  err.message,
                );
                return rej(err);
              }
              console.log(
                `[Session ${sessionId}] ✓ Schema2 query ${i} executed`,
              );
              res();
            });
          });
        }
        resolve(db);
      } catch (err) {
        reject(err);
      }
    });
  });
}
const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`SQLite sandbox server running on http://localhost:${PORT}`);
  console.log(`Test query: SELECT * FROM users;`);
  console.log(
    `Configuration: Max query length: ${MAX_QUERY_LENGTH}, Max results: ${MAX_RESULT_ROWS}, Timeout: ${REQUEST_TIMEOUT}ms`,
  );
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Closing all database connections...");
    for (const [sessionId, db] of sessionDBs.entries()) {
      db.close();
    }
    process.exit(0);
  });
});

module.exports = app;
