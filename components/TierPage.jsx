import React, { useState } from "react";
import "./TierPage.css";
import QuestionRun from "./QuestionRun";
import { useQuestion } from "../src/context/QuestionContext";

const TierPage = ({ tier, onBack, questions, title, showStats = true }) => {
  const { selectedQuestion, setSelectedQuestion } = useQuestion();
  const [clicked, setClicked] = useState(false);

  // 🔥 Load progress
  const progressData = JSON.parse(localStorage.getItem("progress")) || [];

  // 🔥 Mode mapping (Practice / Case)
  const modeType = title?.toLowerCase().includes("practice") ? 0 : 1;

  // 🔥 Filter questions by difficulty
  const filteredQuestions = questions.filter((q) => q.difficulty === tier);

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setClicked(true);
  };

  const handleBackToList = () => {
    setSelectedQuestion(null);
    setClicked(false);
  };

  // 🔥 Get solved status (mode-aware)
  const getSolvedStatus = (questionId) => {
    const p = progressData.find(
      (p) => p.question === questionId && p.type === modeType,
    );
    return p ? p.solved : 0;
  };

  // 🔥 Stats
  const solvedCount = filteredQuestions.filter(
    (q) => getSolvedStatus(q.id) === 2,
  ).length;

  const attemptedCount = filteredQuestions.filter(
    (q) => getSolvedStatus(q.id) === 1,
  ).length;

  const unsolvedCount = filteredQuestions.filter(
    (q) => getSolvedStatus(q.id) === 0,
  ).length;

  const totalCount = filteredQuestions.length;

  const progress =
    totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);

  // 🔥 Status UI
  const getStatusConfig = (question) => {
    const status = getSolvedStatus(question.id);

    if (status === 2) {
      return { text: "✓ COMPLETED", class: "status-solved" };
    }
    if (status === 1) {
      return { text: "⚡ ATTEMPTED", class: "status-attempted" };
    }
    return { text: "○ UNSOLVED", class: "status-unsolved" };
  };

  return (
    <div className="tier-page">
      {/* Header */}
      <div className="tier-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ← BACK
          </button>
        </div>

        {title && (
          <div className="header-center">
            <h2 className="tier-title">
              {title} - {tier}
            </h2>
          </div>
        )}
      </div>

      {/* QuestionRun */}
      {clicked && selectedQuestion ? (
        <QuestionRun handleBackToList={handleBackToList} title={title} />
      ) : (
        <>
          {/* Stats */}
          {showStats && (
            <div className="stats-container">
              <div className="stat-card">
                <span className="label">TOTAL</span>
                <span className="value">{totalCount}</span>
              </div>

              <div className="stat-card">
                <span className="label">COMPLETED</span>
                <span className="value solved-value">{solvedCount}</span>
              </div>

              <div className="stat-card">
                <span className="label">ATTEMPTED</span>
                <span className="value attempted-value">{attemptedCount}</span>
              </div>

              <div className="stat-card">
                <span className="label">UNSOLVED</span>
                <span className="value unsolved-value">{unsolvedCount}</span>
              </div>

              <div className="stat-card">
                <span className="label">PROGRESS</span>
                <span className="value">{progress}%</span>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="questions-list">
            {filteredQuestions.map((q, index) => {
              const statusConfig = getStatusConfig(q);

              return (
                <div
                  key={q.id}
                  className="question-item"
                  onClick={() => handleQuestionClick(q)}
                >
                  <div className="question-left">
                    <div className="q-number">{index + 1}</div>
                    <div className="q-title">{q.title}</div>
                  </div>

                  <div className={`status-badge ${statusConfig.class}`}>
                    {statusConfig.text}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TierPage;
