import "./register.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();

  // Form states
  const [parentName, setParentName] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Mother");
  const [address, setAddress] = useState("");

  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Basic validation
    if (!parentName.trim()) return setError("Parent name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length !== 8) return setError("Password must be exactly 8 characters");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email,
          password,
          phone,
          address,

          // Extra fields (not saved in DB yet, but kept here for future)
          nic,
          occupation,
          relationship,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setIsSubmitting(false);
        return;
      }

      // Save token + user for dashboard access
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to parent dashboard
      navigate("/parent");
    } catch {
      setError("Server not running or connection error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      {/* Header */}
      <h2 className="campus-title">ILA KIDS CAMPUS</h2>
      <h1 className="page-title">Parent Registration</h1>

      {/* Form Container */}
      <div className="form-container">
        <div className="form-grid">
          <div>
            <label>Parent Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />
          </div>

          <div>
            <label>NIC</label>
            <input
              type="text"
              placeholder="Enter your NIC"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label>Occupation</label>
            <input
              type="text"
              placeholder="Enter your occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label>Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option>Mother</option>
              <option>Father</option>
              <option>Guardian</option>
            </select>
          </div>

          <div>
            <label>Address</label>
            <input
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Passwords aligned in one row */}
          <div className="password-group">
            <div className="password-field">
              <label>
                Password <span className="guideline">(Max 8 characters)</span>
              </label>
              <input
                type="password"
                placeholder="Create a password"
                maxLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="password-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                maxLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Show error message */}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className="button-group">
        <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>

        <button className="back-btn" onClick={() => navigate("/login")} disabled={isSubmitting}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default Register;
