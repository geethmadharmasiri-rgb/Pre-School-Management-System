import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./modern-login.css";
import banner from "../assets/images/login-banner.png";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    setMessage("");
    setIsSuccess(false);

    if (!identifier.trim()) {
      setMessage("Please enter your email, NIC or Employee ID");
      return;
    }
    if (password.length !== 8) {
      setMessage("Password must be exactly 8 characters");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: "TEACHER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isTeacher", "true");
      localStorage.setItem("teacherName", data.user?.name || identifier.trim());

      setMessage("Login successful ✅");
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/teacher");
      }, 500);
    } catch {
      setMessage("Server connection error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-page-modern login-teacher-theme">
      <div className="login-container-modern">
        {/* Left Side - Image */}
        <div className="login-image-side">
          <img src={banner} alt="ILA Kids Campus" className="login-banner-img" />
          <div className="login-overlay login-overlay-teacher">
            <div className="login-overlay-content">
              <h2>Welcome to</h2>
              <h1>ILA Kids Campus</h1>
              <p>Empowering educators, inspiring children</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1>Teacher Portal</h1>
              <p>Sign in to access your classroom</p>
            </div>

            <div className="login-form">
              <div className="form-group">
                <label htmlFor="identifier">Email, NIC or Employee ID</label>
                <input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email, NIC or Employee ID"
                  className="modern-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="modern-input"
                  maxLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <small className="input-hint">Must be 8 characters</small>
              </div>

              {message && (
                <div className={`alert-message ${isSuccess ? 'alert-success' : 'alert-error'}`}>
                  {message}
                </div>
              )}

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="link-button"
                  onClick={() => navigate("/forgot-password", { state: { role: "TEACHER" } })}
                >
                  Forgot password?
                </button>
              </div>

              <button className="btn-login-modern btn-login-teacher" onClick={handleLogin}>
                Sign In
              </button>

              <button className="btn-back-modern" onClick={() => navigate("/")}>
                ← Back to Home
              </button>
            </div>

            <div className="login-footer">
              <p>Need help? Contact <a href="mailto:support@ilakids.edu">support@ilakids.edu</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
