import { useState, useEffect } from "react";
import "./Profile.css";
export default function ProfilePage() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
  });
  const [progress, setProgress] = useState({
    noir: 0,
    practice: 0,
  });

  useEffect(() => {
    loadUser();
    loadProgress();
  }, []);

  const loadUser = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        name: user.name,
        email: user.email,
      });
    }
  };

  const loadProgress = () => {
    const data = JSON.parse(localStorage.getItem("progress")) || [];
    let noir = 0;
    let practice = 0;

    data.forEach((p) => {
      if (p.solved === 2) {
        if (p.type === 1) noir++;
        if (p.type === 0) practice++;
      }
    });

    setProgress({ noir, practice });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("progress");
    window.location.href = "/";
  };

  const total = progress.noir + progress.practice;
  const totalMax = 30;

  return (
    <div className="profile-component">
      <div className="profile-container">
        <h2>🕵️ {userData.name || "DETECTIVE"}</h2>
        <p>📧 {userData.email || "classified@queryquest.com"}</p>

        <h3>📊 CASE PROGRESS</h3>

        {/* Noir Mode Progress */}
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>🌙 NOIR MODE</span>
            <span>{progress.noir} / 15</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${(progress.noir / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Practice Mode Progress */}
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>💡 PRACTICE MODE</span>
            <span>{progress.practice} / 15</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${(progress.practice / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Total Progress */}
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>📜 TOTAL CASES SOLVED</span>
            <span>
              {total} / {totalMax}
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${(total / totalMax) * 100}%` }}
            />
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          🔓 LOGOUT
        </button>
      </div>
    </div>
  );
}
