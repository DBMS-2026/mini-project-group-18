// src/SchemaView.jsx
import { useState } from "react";
import "./SchemaView.css";
import { noirSchema, practiceSchema } from "./parse";

export default function SchemaView({ onClose }) {
  const [activeSchema, setActiveSchema] = useState("noir"); // 'noir' or 'practice'
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get current schema based on active tab
  const currentSchema = activeSchema === "noir" ? practiceSchema : noirSchema;

  // Filter tables based on search term
  const filteredTables = currentSchema.tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.columns.some(col => col.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get relationships for selected table
  const getTableRelationships = (tableName) => {
    return currentSchema.relationships.filter(
      rel => rel.from.table === tableName || rel.to.table === tableName
    );
  };

  return (
    <div className="schema-overlay" onClick={onClose}>
      <div className="schema-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header with Schema Switcher */}
        <div className="schema-header">
          <h2>📊 Database Schema Viewer</h2>
          
          <div className="schema-tabs">
            <button 
              className={`schema-tab ${activeSchema === "noir" ? "active" : ""}`}
              onClick={() => {
                setActiveSchema("noir");
                setSelectedTable(null);
                setSearchTerm("");
              }}
            >
              🌙 Noir Mode
            </button>
            <button 
              className={`schema-tab ${activeSchema === "practice" ? "active" : ""}`}
              onClick={() => {
                setActiveSchema("practice");
                setSelectedTable(null);
                setSearchTerm("");
              }}
            >
              💡 Practice Mode
            </button>
          </div>
          
          <button className="schema-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stats Bar */}
        <div className="schema-stats">
          <div className="stat">
            <span className="stat-label">Database:</span>
            <span className="stat-value">{currentSchema.name}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tables:</span>
            <span className="stat-value">{currentSchema.tables.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Relationships:</span>
            <span className="stat-value">{currentSchema.relationships.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Columns:</span>
            <span className="stat-value">
              {currentSchema.tables.reduce((sum, t) => sum + t.columns.length, 0)}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="schema-search">
          <input
            type="text"
            placeholder={`🔍 Search tables or columns in ${activeSchema === "noir" ? "Noir" : "Practice"} Mode...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="schema-search-input"
          />
        </div>

        {/* Content Area */}
        <div className="schema-content">
          {/* Sidebar - Table List */}
          <div className="schema-sidebar">
            <div className="schema-tables-list">
              <h3>Tables ({filteredTables.length})</h3>
              {filteredTables.map(table => (
                <div
                  key={table.name}
                  className={`schema-table-item ${selectedTable?.name === table.name ? "active" : ""}`}
                  onClick={() => setSelectedTable(table)}
                >
                  <span className="table-icon">📋</span>
                  <span className="table-name">{table.name}</span>
                  <span className="table-columns-count">{table.columns.length} cols</span>
                </div>
              ))}
              {filteredTables.length === 0 && (
                <div className="no-results">No tables found</div>
              )}
            </div>
          </div>

          {/* Main Content - Table Details */}
          <div className="schema-main">
            {selectedTable ? (
              <div className="schema-detail">
                <div className="schema-detail-header">
                  <h2>{selectedTable.name}</h2>
                  <div className="table-stats">
                    <span className="stat-badge">{selectedTable.columns.length} Columns</span>
                    <span className="stat-badge">
                      {getTableRelationships(selectedTable.name).length} Relationships
                    </span>
                  </div>
                </div>

                {/* Columns Table */}
                <div className="schema-columns">
                  <h3>📝 Columns</h3>
                  <div className="table-wrapper">
                    <table className="schema-columns-table">
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                          <th>Nullable</th>
                          <th>Key</th>
                          <th>Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.columns.map(column => (
                          <tr key={column.name}>
                            <td className="column-name">{column.name}</td>
                            <td className="column-type">{column.type}</td>
                            <td className="column-nullable">
                              {column.nullable ? "✓ YES" : "✗ NO"}
                            </td>
                            <td className="column-key">
                              {column.primaryKey && "🔑 PK"}
                              {column.unique && !column.primaryKey && "🔗 UQ"}
                            </td>
                            <td className="column-default">
                              {column.default || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Relationships */}
                {getTableRelationships(selectedTable.name).length > 0 && (
                  <div className="schema-relationships">
                    <h3>🔗 Relationships</h3>
                    <div className="relationships-list">
                      {getTableRelationships(selectedTable.name).map((rel, idx) => {
                        const isFrom = rel.from.table === selectedTable.name;
                        return (
                          <div key={idx} className="relationship-item">
                            <span className="rel-direction">
                              {isFrom ? "→" : "←"}
                            </span>
                            <span className="rel-details">
                              {isFrom
                                ? `${selectedTable.name}.${rel.from.column} → ${rel.to.table}.${rel.to.column}`
                                : `${rel.from.table}.${rel.from.column} → ${selectedTable.name}.${rel.to.column}`}
                            </span>
                            <span className="rel-type">{rel.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="schema-placeholder">
                <div className="placeholder-icon">🗄️</div>
                <h3>Select a table to view its schema</h3>
                <p>Click on any table from the left sidebar to see detailed column information, data types, constraints, and relationships.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="schema-footer">
          <div className="schema-summary">
            <span>📊 Active: {activeSchema === "noir" ? "Practice Mode" : "Noir Mode"}</span>
            <span>📋 Tables: {currentSchema.tables.length}</span>
            <span>🔗 Relationships: {currentSchema.relationships.length}</span>
          </div>
          <button className="schema-refresh-btn" onClick={() => setSelectedTable(null)}>
            🔄 Reset View
          </button>
        </div>
      </div>
    </div>
  );
}