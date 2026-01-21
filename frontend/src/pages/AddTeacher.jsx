import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AddTeacher.css";

export default function AddTeacher() {
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState({
    name: "",
    empId: "",
    email: "",
    contact: "",
    qualification: "",
    experience: "",
    address: "",
  });

  const [credentials, setCredentials] = useState({
    tempPassword: "",
    teacherId: "",
  });

  // Generate random ID
  const generateTeacherId = () => {
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `EMP-${randomNum}`;
  };

  // Generate random temporary password
  const generateTempPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "@#$%";
    const all = uppercase + lowercase + numbers + special;

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split("").sort(() => 0.5 - Math.random()).join("");
  };

  // Initialize credentials on component mount
  useEffect(() => {
    generateCredentials();
  }, []);

  const generateCredentials = () => {
    setCredentials({
      tempPassword: generateTempPassword(),
      teacherId: generateTeacherId(),
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSave = (e) => {
    e.preventDefault();

    // ✅ Later connect backend API here (POST)
    // Include credentials in the request
    const registrationData = {
      ...teacher,
      empId: credentials.teacherId,
      tempPassword: credentials.tempPassword,
    };

    console.log("Registration data:", registrationData);
    alert(
      `Teacher registration submitted ✅\n\nTeacher ID: ${credentials.teacherId}\nTemporary Password: ${credentials.tempPassword}`
    );

    // After register go back to teacher management list
    navigate("/admin/teachers");
  };

  return (
    <div className="ac-page-container">
      {/* Main Content */}
      <main className="ac-main">
        <header className="ac-header">
          <h1>Add New Teacher</h1>
        </header>

        <form className="ac-grid" onSubmit={handleSave}>
          {/* LEFT CARD - TEACHER INFORMATION */}
          <div className="ac-card">
            <div className="ac-cardHeader">
              <div>
                <h2>Teacher Information</h2>
                <p>Enter the teacher's personal details.</p>
              </div>
            </div>

            {/* Teacher Personal Info Section */}
            <div className="ac-section">
              <h3 className="ac-section-title">Personal Information</h3>
              
              <div className="ac-field-row">
                <div className="ac-field">
                  <label>Teacher Name *</label>
                  <input
                    placeholder="Enter full name"
                    value={teacher.name}
                    onChange={(e) =>
                      setTeacher({ ...teacher, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Employee ID *</label>
                  <input
                    placeholder="e.g., EMP-001"
                    value={teacher.empId}
                    onChange={(e) =>
                      setTeacher({ ...teacher, empId: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="ac-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={teacher.email}
                  onChange={(e) =>
                    setTeacher({ ...teacher, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="ac-field">
                <label>Contact Number *</label>
                <input
                  placeholder="Enter contact number"
                  value={teacher.contact}
                  onChange={(e) =>
                    setTeacher({ ...teacher, contact: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Teacher Address Section */}
            <div className="ac-section">
              <h3 className="ac-section-title">Address</h3>
              
              <div className="ac-field">
                <label>Residential Address</label>
                <input
                  placeholder="Enter residential address"
                  value={teacher.address}
                  onChange={(e) =>
                    setTeacher({ ...teacher, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* RIGHT CARD - PROFESSIONAL INFORMATION */}
          <div className="ac-card">
            <div className="ac-cardHeader">
              <div>
                <h2>Professional Info</h2>
                <p>Teaching experience and qualifications.</p>
              </div>
            </div>

            {/* Professional Section */}
            <div className="ac-section">
              <h3 className="ac-section-title">Professional Details</h3>
              
              <div className="ac-field">
                <label>Qualification *</label>
                <input
                  placeholder="e.g., Bachelor of Education, M.Ed"
                  value={teacher.qualification}
                  onChange={(e) =>
                    setTeacher({ ...teacher, qualification: e.target.value })
                  }
                  required
                />
              </div>

              <div className="ac-field">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={teacher.experience}
                  onChange={(e) =>
                    setTeacher({ ...teacher, experience: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Login Credentials Section */}
            <div className="ac-section">
              <h3 className="ac-section-title">Login Credentials</h3>
              <p style={{ fontSize: "12px", color: "rgba(11, 34, 48, 0.7)", marginBottom: "12px" }}>
                Auto-generated credentials for the teacher's first login
              </p>

              {/* Teacher ID */}
              <div className="ac-field">
                <label>Teacher ID (Auto-generated)</label>
                <div className="credential-display">
                  <input
                    type="text"
                    value={credentials.teacherId}
                    readOnly
                    className="credential-input"
                  />
                  <button
                    type="button"
                    className="credential-copy"
                    onClick={() => copyToClipboard(credentials.teacherId)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="ac-field">
                <label>Temporary Password (Auto-generated)</label>
                <div className="credential-display">
                  <input
                    type="text"
                    value={credentials.tempPassword}
                    readOnly
                    className="credential-input"
                  />
                  <button
                    type="button"
                    className="credential-copy"
                    onClick={() => copyToClipboard(credentials.tempPassword)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                type="button"
                className="regenerate-btn"
                onClick={generateCredentials}
              >
                🔄 Regenerate Credentials
              </button>
            </div>
          </div>

          {/* BOTTOM BUTTONS */}
          <div className="ac-actions">
            <button
              type="button"
              className="ac-back"
              onClick={() => navigate("/admin/teachers")}
            >
              Back
            </button>

            <button type="submit" className="ac-register">
              REGISTER TEACHER
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
