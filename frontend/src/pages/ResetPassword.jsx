import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    // Frontend simulation
    setMessage("Password reset successful! You can now log in.");
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Reset Password</h2>
        <p>Please enter your new password below.</p>

        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {message && <div className="message">{message}</div>}

          <button type="submit">Save Password</button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Login
        </Link>
      </div>

      {/* Bottom-left campus name */}
      <div className="bottom-campus">ILA KIDS CAMPUS</div>
    </div>
  );
};

export default ResetPassword;
