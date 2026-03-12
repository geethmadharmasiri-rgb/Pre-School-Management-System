import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./modern-login.css";
import banner from "../assets/images/login-banner.png";

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async () => {
        setMessage("");
        setIsSuccess(false);

        if (!email.trim()) {
            setMessage("Please enter your email");
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
                    email: email.trim(),
                    password,
                    role: "ADMIN",
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
                navigate("/admin");
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
        <div className="login-page-modern login-admin-theme">
            <div className="login-container-modern">
                {/* Left Side - Image */}
                <div className="login-image-side">
                    <img src={banner} alt="ILA Kids Campus" className="login-banner-img" />
                    <div className="login-overlay login-overlay-admin">
                        <div className="login-overlay-content">
                            <h2>Welcome to</h2>
                            <h1>ILA Kids Campus</h1>
                            <p>Administrative Control Center</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-side">
                    <div className="login-form-wrapper">
                        <div className="login-header">
                            <h1>Admin Portal</h1>
                            <p>Sign in to manage the system</p>
                        </div>

                        <div className="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="modern-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    onClick={() => navigate("/forgot-password", { state: { role: "ADMIN" } })}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button className="btn-login-modern btn-login-admin" onClick={handleLogin}>
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

export default AdminLogin;
