import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import banner from "../assets/images/login-banner.jpg";

const Login = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async () => {
    setMessage("");
    setIsSuccess(false);

    // ✅ Basic validations
    if (!role) {
      setMessage("Please select a role");
      return;
    }
    if (!email.trim()) {
      setMessage("Please enter email / username");
      return;
    }
    if (password.length !== 8) {
      setMessage("Password must be exactly 8 characters");
      return;
    }

    // ✅ Backend expects role values like: ADMIN / TEACHER / PARENT
    const backendRole =
      role === "Admin" ? "ADMIN" : role === "Teacher" ? "TEACHER" : "PARENT";

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: backendRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      // ✅ Save token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful ✅");
      setIsSuccess(true);

      // ✅ Redirect based on role
      setTimeout(() => {
        if (data.user.role === "PARENT") navigate("/parent-dashboard");
        else if (data.user.role === "ADMIN") navigate("/admin");
        else if (data.user.role === "TEACHER") navigate("/teacher");
        else navigate("/");
      }, 500);
    } catch (e) {
      setMessage("API not connected / server error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* LEFT IMAGE */}
        <div className="login-image">
          <img src={banner} alt="Kids Campus" />
        </div>

        {/* RIGHT FORM */}
        <div className="login-form-section">
          <h1 className="login-title">ILA Kids Campus</h1>
          <p className="login-subtitle">© ILA Kids Campus 2026 – Parent / Staff Login</p>

          <select
            className="login-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option>Admin</option>
            <option>Teacher</option>
            <option>Parent</option>
          </select>

          <input
            type="email"
            placeholder="Email / Username"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password (8 characters)"
            className="login-input"
            maxLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* MESSAGE */}
          {message && (
            <p className={isSuccess ? "success-msg" : "error-msg"}>{message}</p>
          )}

          <div className="remember-forgot">
            <span className="forgot-link" onClick={() => navigate("/forgot-password")}>
              Forgot Password?
            </span>

            <label className="remember-me">
              <input type="checkbox" />
              Remember Me
            </label>
          </div>

          <button className="btn login-btn" onClick={handleLogin}>
            Login
          </button>

          <button className="btn register-btn" onClick={() => navigate("/register")}>
            Register as Parent
          </button>
        </div>
      </div>

      <button className="btn back-btn back-outside" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
};

export default Login;
