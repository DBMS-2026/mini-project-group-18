import React, { useState, useEffect } from "react";
import "./Nav.css";
import { useNavigate, useLocation } from "react-router-dom";

/* ---------- Icons (same as yours) ---------- */
const IconUser = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M2 13.5c0-2.5 2.7-4 6-4s6 1.5 6 4"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const IconHome = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path
      d="M1.5 7L8 1.5L14.5 7V14.5H10V10H6v4.5H1.5V7Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg
    className={`dropdown-icon ${open ? "open" : ""}`}
    viewBox="0 0 8 8"
    fill="none"
  >
    <polyline points="1,2 4,6 7,2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
/* ---------- MAIN NAV ---------- */
export default function Nav({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);

  // 🔥 Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // ✅ THIS is what you need
    }
  }, []);

  // Tabs logic
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === "/practice") return "practice";
    if (path === "/cases") return "cases";
    return "";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  /* ---------- HANDLERS ---------- */

  const handleHomeClick = () => navigate("/");

  const handleLogout = () => {
    localStorage.removeItem("user"); // 🧹 clear user
    localStorage.removeItem("progress");
    setUser(null);
    if (onLogout) onLogout();
    navigate("/");
  };

  /* ---------- UI ---------- */

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-brand" onClick={handleHomeClick}>
        <span className="nav-title">QueryQuest</span>
      </div>

      {/* Right Side */}
      <div className="nav-actions">
        <button className="nav-cta" onClick={handleHomeClick}>
          <IconHome />
          <span>Home</span>
        </button>

        {/* 🔥 CONDITIONAL RENDER */}
        {!user ? (
          <button className="nav-cta" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        ) : (
          <div className="profile-wrapper">
            <button
              className="profile-trigger"
              onClick={() => setShowProfileMenu((prev) => !prev)}
            >
              <div className="profile-avatar">
                <IconUser />
              </div>

              {/* 👇 USER NAME */}
              <span className="profile-name">{user.name}</span>

              <IconChevron open={showProfileMenu} />
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/progress");
                  }}
                >
                  My Profile
                </button>

                <button className="dropdown-item">Settings</button>

                <div className="dropdown-divider" />

                <button className="nav-cta" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
