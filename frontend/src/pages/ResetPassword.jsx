import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import "./modern-login.css";
import banner from "../assets/images/login-banner.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [userRole, setUserRole] = useState("PARENT"); // Track user role
  const [authType, setAuthType] = useState("NIC"); // NIC or EMAIL
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("ResetPassword Page Mounted", { locationState: location.state, searchParams: searchParams.toString() });

    // Check for token in state (from NIC verification)
    if (location.state?.token) {
      setToken(location.state.token);
      setAuthType("NIC");
      // Get role from state, default to PARENT
      setUserRole(location.state.role || "PARENT");
    }
    // Check for token in URL (from Email link)
    else {
      const tokenFromUrl = searchParams.get("token");
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        setAuthType("EMAIL");
        // For email-based reset, we might not have role in URL, default to PARENT
        setUserRole("PARENT");
      } else {
        setMessage("Invalid or missing reset token. Please request a new password reset.");
        setIsSuccess(false);
      }
    }
  }, [searchParams, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!token) {
      setMessage("Invalid reset link/token.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in all fields");
      return;
    }

    if (newPassword.length !== 8) {
      setMessage("Password must be exactly 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authType === "NIC"
        ? "http://localhost:5000/api/auth/reset-password"
        : "http://localhost:5000/api/auth/reset-password-email";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to reset password");
        setIsSuccess(false);
      } else {
        setMessage(data.message);
        setIsSuccess(true);
        // Clean up state
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          // Redirect based on user role
          if (userRole === "TEACHER") {
            navigate("/teacher-login");
          } else if (userRole === "ADMIN") {
            navigate("/admin-login");
          } else {
            navigate("/parent-login");
          }
        }, 3000);
      }
    } catch (error) {
      setMessage("Server connection error. Please try again later.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className={`login-page-modern ${userRole === 'ADMIN' ? 'login-admin-theme' : userRole === 'TEACHER' ? 'login-teacher-theme' : ''}`}>
      <div className="login-container-modern">
        {/* Left Side - Image */}
        <div className="login-image-side">
          <img src={banner} alt="ILA Kids Campus" className="login-banner-img" />
          <div className={`login-overlay ${userRole === 'ADMIN' ? 'login-overlay-admin' : userRole === 'TEACHER' ? 'login-overlay-teacher' : ''}`}>
            <div className="login-overlay-content">
              <h2>Welcome to</h2>
              <h1>ILA Kids Campus</h1>
              <p>Reset Your Password</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1>Reset Password</h1>
              <p>Enter your new password</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className="modern-input"
                  maxLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading || !token}
                />
                <small className="input-hint">Must be exactly 8 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className="modern-input"
                  maxLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || !token}
                />
                <small className="input-hint">Re-enter your password</small>
              </div>

              {message && (
                <div className={`alert-message ${isSuccess ? 'alert-success' : 'alert-error'}`}>
                  {message}
                  {isSuccess && (
                    <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                      Redirecting to login page...
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className={`btn-login-modern ${userRole === 'ADMIN' ? 'btn-login-admin' : userRole === 'TEACHER' ? 'btn-login-teacher' : ''}`}
                disabled={isLoading || !token || isSuccess}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                className="btn-back-modern"
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                ← Back to Home
              </button>
            </form>

            <div className="login-footer">
              <p>Need help? Contact <a href="mailto:support@ilakids.edu">support@ilakids.edu</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
