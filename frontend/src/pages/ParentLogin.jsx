import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./modern-login.css";
import banner from "../assets/images/login-banner.png";

const ParentLogin = () => {
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
            setMessage("Please enter your email or NIC");
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
                    role: "PARENT",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setMessage("Login successful ✅");
            setIsSuccess(true);

            setTimeout(() => {
                navigate("/parent");
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
        <div className="login-page-modern">
            <div className="login-container-modern">
                {/* Left Side - Image */}
                <div className="login-image-side">
                    <img src={banner} alt="ILA Kids Campus" className="login-banner-img" />
                    <div className="login-overlay">
                        <div className="login-overlay-content">
                            <h2>Welcome to</h2>
                            <h1>ILA Kids Campus</h1>
                            <p>Your child's journey starts here</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-side">
                    <div className="login-form-wrapper">
                        <div className="login-header">
                            <h1>Parent Portal</h1>
                            <p>Sign in to access your dashboard</p>
                        </div>

                        <div className="login-form">
                            <div className="alert-message alert-info">
                                <strong>🆕 First time logging in?</strong><br />
                                To set up your account, click the <strong>"Sign Up"</strong> button below. You will need your <strong>NIC</strong> and <strong>Email</strong>.
                            </div>

                            <div className="form-group">
                                <label htmlFor="identifier">Email or NIC</label>
                                <input
                                    id="identifier"
                                    type="text"
                                    placeholder="Enter your email or NIC"
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
                                    onClick={() => navigate("/forgot-password", { state: { role: "PARENT" } })}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button className="btn-login-modern" onClick={handleLogin}>
                                Sign In
                            </button>

                            <button
                                className="btn-login-modern btn-signup-modern"
                                onClick={() => navigate("/forgot-password", { state: { role: "PARENT", isFirstTime: true } })}
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', marginTop: '10px' }}
                            >
                                Sign Up (First Time User)
                            </button>

                            <button className="btn-back-modern" onClick={() => navigate("/")} style={{ marginTop: '20px' }}>
                                ← Back to Home
                            </button>
                        </div>

                        {/* Removed the login-footer section */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentLogin;
