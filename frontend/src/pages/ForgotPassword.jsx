import React from "react";
import { Link } from "react-router-dom";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-icon">🔒</div>

        <h2>Forgot Password?</h2>
        <p>
          Don’t worry! Enter your registered email and we’ll send you a reset
          link.
        </p>

        <form>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            required
          />

          <button type="submit">Send Reset Link</button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Login
        </Link>
      </div>

      {/* Top-left campus name */}
      <div className="top-campus">ILA KIDS CAMPUS</div>
    </div>
  );
};

export default ForgotPassword;
