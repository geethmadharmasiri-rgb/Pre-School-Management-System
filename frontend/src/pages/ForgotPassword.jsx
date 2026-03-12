import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./modern-login.css";
import banner from "../assets/images/login-banner.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [step, setStep] = useState(1); // 1: Identity, 2: OTP, 3: Reset
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check role proportions
  const isAdmin = location.state?.role === "ADMIN";
  const isTeacher = location.state?.role === "TEACHER";
  const isParent = location.state?.role === "PARENT" || (!isAdmin && !isTeacher);
  const userRole = location.state?.role || "PARENT"; // Default to PARENT

  const isFirstTime = location.state?.isFirstTime || false;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setIsLoading(true);

    try {
      // Admins use forgot-password (email only), others use request-otp (nic + email)
      const endpoint = isAdmin ? "/api/auth/forgot-password" : "/api/auth/request-otp";
      const body = isAdmin
        ? { email: email.trim(), role: "ADMIN" }
        : { nic: nic.trim(), email: email.trim(), role: userRole };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setStep(2); // Go to OTP entry step
      } else {
        setMessage(data.message || "Failed to request OTP");
      }
    } catch (error) {
      setMessage("Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetToken(data.resetToken);
        setStep(3);
        setMessage("OTP verified! Please set your new password.");
        setIsSuccess(true);
      } else {
        setMessage(data.message || "Invalid OTP");
      }
    } catch (error) {
      setMessage("Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

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
      const res = await fetch("http://localhost:5000/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(isFirstTime ? "Account setup successful! Redirecting to login..." : "Password reset successful! Redirecting to login...");
        setIsSuccess(true);
        setTimeout(() => {
          if (userRole === "TEACHER") navigate("/teacher-login");
          else if (userRole === "ADMIN") navigate("/admin-login");
          else navigate("/parent-login");
        }, 3000);
      } else {
        setMessage(data.message || "Reset failed");
      }
    } catch (error) {
      setMessage("Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-page-modern ${isAdmin ? 'login-admin-theme' : isTeacher ? 'login-teacher-theme' : isParent ? 'login-parent-theme' : ''}`}>
      <div className="login-container-modern">
        <div className="login-image-side">
          <img src={banner} alt="ILA Kids Campus" className="login-banner-img" />
          <div className={`login-overlay ${isAdmin ? 'login-overlay-admin' : isTeacher ? 'login-overlay-teacher' : isParent ? 'login-overlay-parent' : ''}`}>
            <div className="login-overlay-content">
              <h2>Welcome to</h2>
              <h1>ILA Kids Campus</h1>
              <p>{isFirstTime ? 'First Time Account Setup' : 'Secure Identity Recovery'}</p>
            </div>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1>{isFirstTime ? 'Parent Sign Up' : 'Forgot Password?'}</h1>
              <p style={{ color: isTeacher ? '#f97316' : isParent ? '#10b981' : '#1e293b', fontWeight: '600', marginBottom: '10px' }}>
                {isAdmin ? 'ADMIN PORTAL' : isTeacher ? 'TEACHER PORTAL' : 'PARENT PORTAL'}
              </p>

              {step === 1 && (
                <p>{isAdmin ? "Enter your email to receive an OTP." : isFirstTime ? "Verify your NIC and Email to set up your account." : "Verify your identity with NIC and Email."}</p>
              )}
              {step === 2 && (
                <p>Enter the 6-digit OTP from your terminal or email.</p>
              )}
              {step === 3 && (
                <p>{isFirstTime ? "Create your new 8-character password." : "Create a new 8-character password."}</p>
              )}
            </div>

            <div className="login-form">
              {/* STEP 1: REQUEST OTP */}
              {step === 1 && (
                <form onSubmit={handleRequestOtp}>
                  {!isAdmin && (
                    <div className="form-group">
                      <label>NIC Number</label>
                      <input type="text" className="modern-input" value={nic} onChange={e => setNic(e.target.value)} required />
                      <small className="input-hint">Your National Identity Card number</small>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Registered Email</label>
                    <input type="email" className="modern-input" value={email} onChange={e => setEmail(e.target.value)} required />
                    <small className="input-hint">The email you provided during registration</small>
                  </div>
                  <button type="submit" className={`btn-login-modern ${isAdmin ? 'btn-login-admin' : isTeacher ? 'btn-login-teacher' : isParent ? 'btn-login-parent' : ''}`} disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Send OTP"}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label>Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      className="modern-input"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      required
                      autoFocus
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '24px' }}
                    />
                    <small className="input-hint">Check your backend terminal for the code</small>
                  </div>
                  <button type="submit" className={`btn-login-modern ${isAdmin ? 'btn-login-admin' : isTeacher ? 'btn-login-teacher' : isParent ? 'btn-login-parent' : ''}`} disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button type="button" className="link-button" onClick={() => setStep(1)} style={{ marginTop: '10px' }}>
                    Didn't get code? Request again
                  </button>
                </form>
              )}

              {/* STEP 3: RESET PASSWORD */}
              {step === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="8 characters" className="modern-input" maxLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="8 characters" className="modern-input" maxLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className={`btn-login-modern ${isAdmin ? 'btn-login-admin' : isTeacher ? 'btn-login-teacher' : isParent ? 'btn-login-parent' : ''}`} disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}

              {message && (
                <div className={`alert-message ${isSuccess ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '20px' }}>
                  {message}
                </div>
              )}

              <button type="button" className="btn-back-modern" onClick={() => navigate(-1)} disabled={isLoading} style={{ marginTop: '20px' }}>
                ← Back to Login
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

export default ForgotPassword;
