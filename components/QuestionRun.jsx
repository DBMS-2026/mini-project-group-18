import { useState, useRef } from "react";
import "./QuestionRun.css";
import questions from "../src/questions";
import questions2 from "../src/questions2";
import { useQuestion } from "../src/context/QuestionContext";
import SchemaView from "./SchemaView";

export default function QuestionRun({ title }) {
  const inp = useRef();
  const { selectedQuestion, setSelectedQuestion } = useQuestion();
  const [correct, setCorrect] = useState(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // 🚨 Safety check
  if (!selectedQuestion) return <p>No question selected</p>;

  function onClick() {
    const questionsList = title === "Cases Mode" ? questions2 : questions;
    const nextQuestion = questionsList.find(
      (q) => q.id === selectedQuestion.id + 1,
    );
    if (nextQuestion) {
      setSelectedQuestion(nextQuestion);
      setQuery("");
      setResult(null);
      setCorrect(null);
      setAnswerInput("");
      setAnswerSubmitted(false);
    }
  }

  const lineCount = Math.max(query.split("\n").length, 8);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  const difficultyClass =
    selectedQuestion.difficulty?.toLowerCase() === "easy"
      ? "badge-easy"
      : selectedQuestion.difficulty?.toLowerCase() === "hard"
        ? "badge-hard"
        : "badge-medium";

  async function handleSubmit() {
    setLoading(true);

    if (title === "Cases Mode") {
      // Cases Mode - just run the query without auto-checking
      try {
        const response = await fetch("http://localhost:5000/cases/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
          }),
        });

        const data = await response.json();

        if (data.error) {
          alert(data.error);
          setResult(null);
        } else {
          setResult(data.rows ?? []);
        }
      } catch (err) {
        console.error(err);
        alert("Error running query");
      } finally {
        setLoading(false);
      }
    } else {
      // Practice mode - original logic preserved
      try {
        const response = await fetch("http://localhost:5000/req", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            minimalAnswer: selectedQuestion.minimalAnswer,
            maximalAnswer: selectedQuestion.maximalAnswer,
          }),
        });

        const data = await response.json();

        setCorrect(data.correct);
        setResult(data.rows ?? []);
        const storedUser = JSON.parse(localStorage.getItem("user"));
        let p = JSON.parse(localStorage.getItem("progress")) || [];

        // 🔥 Check if already solved
        const existing = p.find((p) => p.question === selectedQuestion.id);

        if (existing && existing.solved === 2) {
          console.log("✅ Already solved, skipping...");
          setLoading(false);
          return; // 🚫 stop everything
        }
        const progressData = {
          id: storedUser?.id, // ✅ correct UUID
          type: title === "Practice mode" ? 0 : 1,
          question: selectedQuestion.id,
          solved: data.correct ? 2 : 1,
        };

        // 🔥 send to backend (upsert)
        await fetch("http://localhost:5000/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progressData),
        });

        // 🧠 update localStorage (sync layer)
        let progress = JSON.parse(localStorage.getItem("progress")) || [];

        const index = progress.findIndex(
          (p) => p.question === progressData.question,
        );

        if (index !== -1) {
          progress[index] = progressData; // update
        } else {
          progress.push(progressData); // insert
        }

        localStorage.setItem("progress", JSON.stringify(progress));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleSubmitAnswer() {
    if (!answerInput.trim()) {
      alert("Please provide an answer");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/cases/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: answerInput,
          expectedAnswer: selectedQuestion.answer,
          questionId: selectedQuestion.id,
        }),
      });

      const data = await response.json();

      setCorrect(data.correct);
      setAnswerSubmitted(true);

      const storedUser = JSON.parse(localStorage.getItem("user"));

      // Check if already solved
      let p = JSON.parse(localStorage.getItem("progress")) || [];
      const existing = p.find((p) => p.question === selectedQuestion.id);

      if (existing && existing.solved === 2) {
        console.log("✅ Already solved, skipping...");
        setLoading(false);
        return;
      }

      const progressData = {
        id: storedUser?.id,
        type: 1, // Cases Mode
        question: selectedQuestion.id,
        solved: data.correct ? 2 : 1,
      };

      // Send to backend
      await fetch("http://localhost:5000/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progressData),
      });

      // Update localStorage
      let progress = JSON.parse(localStorage.getItem("progress")) || [];
      const index = progress.findIndex(
        (p) => p.question === progressData.question,
      );

      if (index !== -1) {
        progress[index] = progressData;
      } else {
        progress.push(progressData);
      }

      localStorage.setItem("progress", JSON.stringify(progress));
    } catch (err) {
      console.error(err);
      alert("Error submitting answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showSchema && <SchemaView onClose={() => setShowSchema(false)} />}

      <div className="question-run">
        <div className="qr-topbar">
          <button
            className="qr-back-btn"
            onClick={() => setSelectedQuestion(null)}
          >
            Back
          </button>

          <button className="qr-schema-btn" onClick={() => setShowSchema(true)}>
            View Schema
          </button>

          <div className="qr-breadcrumb">
            <span>Problems</span>
            <span className="qr-breadcrumb-sep">/</span>
            <span className="qr-breadcrumb-current">
              {selectedQuestion.title}
            </span>
          </div>

          <span className={`qr-difficulty-badge ${difficultyClass}`}>
            {selectedQuestion.difficulty}
          </span>
        </div>

        <div className="qr-content-wrapper">
          <div className="qr-top-section">
            {/* LEFT */}
            <div className="qr-panel-left">
              <div className="qr-panel-header">
                <span className="qr-panel-tab">Problem</span>
              </div>

              <div className="qr-panel-body">
                <h2 className="qr-problem-title">{selectedQuestion.title}</h2>
                <div className="qr-divider" />
                <p className="qr-problem-body">{selectedQuestion.question}</p>

                {/* Answer Input for Cases Mode */}
                {title === "Cases Mode" && (
                  <div className="qr-answer-section">
                    <div className="qr-answer-header">
                      <span className="qr-answer-title">📝 Your Answer</span>
                      <p className="qr-answer-description">
                        Based on the query results above, what is the answer?
                      </p>
                    </div>

                    <input
                      type="text"
                      className="qr-answer-input"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Enter your answer here..."
                      disabled={answerSubmitted}
                    />

                    {!answerSubmitted ? (
                      <button
                        className="qr-submit-answer-btn"
                        onClick={handleSubmitAnswer}
                        disabled={loading || !answerInput.trim()}
                      >
                        {loading ? "Submitting..." : "Submit Answer"}
                      </button>
                    ) : (
                      <div className="qr-answer-feedback">
                        <span
                          className={`feedback-badge ${correct ? "correct" : "incorrect"}`}
                        >
                          {correct ? "✓ Correct Answer!" : `✗ Incorrect.`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="qr-panel-right">
              <div className="qr-editor-header">
                <span className="qr-editor-lang">SQL</span>
                <span className="qr-editor-hint">
                  {title === "Cases Mode"
                    ? "Write a query to find the answer"
                    : "Write your query below"}
                </span>
              </div>

              <div className="qr-editor-area">
                <div className="qr-editor-gutter">
                  <div className="qr-line-numbers">
                    {lines.map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>

                  <textarea
                    ref={inp}
                    className="qr-sql-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SELECT ..."
                    spellCheck={false}
                    disabled={answerSubmitted}
                  />
                </div>
              </div>

              <div className="qr-action-bar">
                <div className="qr-status">
                  <span
                    className={`qr-status-dot ${query.trim() ? "ready" : ""}`}
                  />
                  {loading
                    ? "Executing..."
                    : query.trim()
                      ? "Ready"
                      : "Awaiting input"}
                </div>

                <button className="btn-next" onClick={onClick}>
                  Next →
                </button>

                <button
                  className="btn-run"
                  onClick={handleSubmit}
                  disabled={loading || !query.trim() || answerSubmitted}
                >
                  {loading ? "Running..." : "Run Query"}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {result !== null && (
            <div className="qr-output-section">
              <div className="qr-results">
                <div className="qr-results-header">
                  <span className="qr-results-tab">
                    {title === "Cases Mode" ? "Query Results" : "Output"}
                  </span>

                  {title !== "Cases Mode" && (
                    <span
                      className={`qr-verdict ${correct ? "verdict-correct" : "verdict-wrong"}`}
                    >
                      {correct ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  )}

                  <span className="qr-row-count">
                    {result.length} row{result.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="qr-table-scroll">
                  {result.length === 0 ? (
                    <p className="qr-no-rows">— No rows returned —</p>
                  ) : (
                    <table className="qr-result-table">
                      <thead>
                        <tr>
                          {Object.keys(result[0]).map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => (
                              <td key={j}>{String(val ?? "NULL")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
