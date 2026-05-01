// src/parse.js
import crimeSchema from "./scheme.js";
import businessSchema from "./scheme2.js";

function parseSchema(schemaData, schemaName) {
    const tables = [];
    const relationships = [];

    schemaData.forEach(createStmt => {
        const tableNameMatch = createStmt.match(/CREATE TABLE (\w+)/i);
        if (!tableNameMatch) return;
        
        const tableName = tableNameMatch[1];
        const contentMatch = createStmt.match(/CREATE TABLE \w+ \((.+)\)/s);
        if (!contentMatch) return;
        
        const content = contentMatch[1];
        const lines = content.split(/\n/).map(l => l.trim()).filter(l => l && l !== ')');
        
        const columns = [];
        
        lines.forEach(line => {
            const columnMatch = line.match(/^(\w+)\s+([\w\(\)]+)(.*)$/);
            if (columnMatch && !line.toUpperCase().startsWith('FOREIGN KEY') && !line.toUpperCase().startsWith('PRIMARY KEY')) {
                const columnName = columnMatch[1];
                const dataType = columnMatch[2];
                const constraints = columnMatch[3];
                
                columns.push({
                    name: columnName,
                    type: dataType,
                    nullable: !constraints.toUpperCase().includes('NOT NULL'),
                    primaryKey: constraints.toUpperCase().includes('PRIMARY KEY'),
                    unique: constraints.toUpperCase().includes('UNIQUE'),
                    default: constraints.match(/DEFAULT\s+([^,\s]+)/i)?.[1] || null,
                    check: constraints.match(/CHECK\s+\(([^)]+)\)/i)?.[1] || null
                });
            }
            
            const fkMatch = line.match(/FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)/i);
            if (fkMatch) {
                relationships.push({
                    from: { table: tableName, column: fkMatch[1] },
                    to: { table: fkMatch[2], column: fkMatch[3] },
                    type: "FOREIGN KEY"
                });
            }
        });
        
        tables.push({ 
            name: tableName, 
            columns: columns 
        });
    });
    
    return { tables, relationships, name: schemaName };
}

export const noirSchema = parseSchema(crimeSchema, "Noir Mode - Crime Database");
export const practiceSchema = parseSchema(businessSchema, "Practice Mode - Business Database");

export function getTableRelationships(database, tableName) {
    return database.relationships.filter(
        rel => rel.from.table === tableName || rel.to.table === tableName
    );
}

export function getTableSchema(database, tableName) {
    return database.tables.find(t => t.name === tableName);
}

export function getAllTableNames(database) {
    return database.tables.map(t => t.name);
}

console.log('Noir Schema loaded:', noirSchema.tables.length, 'tables');
console.log('Practice Schema loaded:', practiceSchema.tables.length, 'tables');