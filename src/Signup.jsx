import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const [verifyError, setVerifyError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [edit, setEdit] = useState({
    name: false,
    email: false,
    password: false,
  });

  const passwordIsInvalid =
    edit.password &&
    !/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/.test(formData.password);

  const emailIsInvalid = edit.email && !/^\S+@\S+\.\S+$/.test(formData.email);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setEdit((prev) => ({
      ...prev,
      [name]: false,
    }));
  }

  function handleBlur(e) {
    const { name } = e.target;

    setEdit((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (emailIsInvalid || passwordIsInvalid) return;

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = { message: "No response from server" };
      }

      if (!response.ok) {
        alert(data.message || "Unknown error");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.needsVerification) {
        setShowVerifyModal(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="signup-container">
      <div className="back-home">
        <button className="back-home-btn" onClick={() => navigate("/")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 12l6-6M3 12l6 6" />
          </svg>
          BACK
        </button>
      </div>

      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="signup-title">Join QueryQuest</h1>
          <p className="signup-subtitle">Begin your investigation</p>
          <div className="divider"></div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="signup-form">
          <div className="form-group">
            <label className="form-label">FULL NAME</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                name="name"
                placeholder="Detective Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="signup-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                placeholder="detective@queryquest.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="signup-input"
              />
            </div>
          </div>

          {emailIsInvalid && (
            <div className="error-message">
              ⚡ Please enter a valid email address
            </div>
          )}

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="signup-input"
              />
            </div>
          </div>
          {showVerifyModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>📧 Verify Your Email</h2>
                <p>
                  We sent a verification link to your email. Please verify
                  before logging in.
                </p>

                <button
                  onClick={async () => {
                    try {
                      const storedUser = JSON.parse(
                        localStorage.getItem("user"),
                      );

                      const res = await fetch(
                        "http://localhost:5000/check-verification",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ id: storedUser?.id }),
                        },
                      );

                      const data = await res.json();

                      if (data.verified) {
                        setShowVerifyModal(false);
                        navigate("/");
                      } else {
                        setVerifyError("❌ Please verify your email first");
                      }
                    } catch (err) {
                      console.error(err);
                      setVerifyError("Something went wrong");
                    }
                  }}
                >
                  OK
                </button>
                {verifyError && (
                  <p style={{ color: "red", marginTop: "10px" }}>
                    {verifyError}
                  </p>
                )}
              </div>
            </div>
          )}
          {edit.password && (
            <div className="password-requirements">
              <div
                className={`requirement ${formData.password.length >= 6 ? "valid" : "invalid"}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {formData.password.length >= 6 ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <circle cx="12" cy="12" r="10" />
                  )}
                </svg>
                At least 6 characters
              </div>
              <div
                className={`requirement ${/[A-Z]/.test(formData.password) ? "valid" : "invalid"}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/[A-Z]/.test(formData.password) ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <circle cx="12" cy="12" r="10" />
                  )}
                </svg>
                One uppercase letter
              </div>
              <div
                className={`requirement ${/[^A-Za-z0-9]/.test(formData.password) ? "valid" : "invalid"}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/[^A-Za-z0-9]/.test(formData.password) ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <circle cx="12" cy="12" r="10" />
                  )}
                </svg>
                One special character
              </div>
            </div>
          )}

          {passwordIsInvalid && (
            <div className="error-message">
              ⚡ Password must be 6+ chars, include uppercase & special
              character
            </div>
          )}

          <button type="submit" className="signup-btn">
            JOIN THE FORCE
          </button>
        </form>

        <div className="login-link">
          <span className="login-link-text">Already a detective?</span>
          <button className="login-link-btn" onClick={() => navigate("/login")}>
            SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
}
