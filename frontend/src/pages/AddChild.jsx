import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddChild.css";

export default function AddChild() {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================
  const [parentMode, setParentMode] = useState("new");
  const [selectedRole, setSelectedRole] = useState("father");

  const [parentData, setParentData] = useState({
    father: {
      firstName: "",
      lastName: "",
      nic: "",
      contact: "",
      email: "",
      occupation: "",
      address: "",
    },
    mother: {
      firstName: "",
      lastName: "",
      nic: "",
      contact: "",
      email: "",
      occupation: "",
      address: "",
    },
    guardian: {
      firstName: "",
      lastName: "",
      nic: "",
      contact: "",
      email: "",
      occupation: "",
      address: "",
    },
  });

  const [child, setChild] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    age: "",
    gender: "Male",
    bloodType: "",
    medicalConditions: "",
    enrollmentDate: "",
    programName: "",
  });

  // Existing parent search
  const [searchNIC, setSearchNIC] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExistingParents, setSelectedExistingParents] = useState({});

  // Demo existing parents
  const existingParents = [
    {
      id: 1,
      firstName: "John",
      lastName: "Silva",
      nic: "123456789V",
      email: "john@example.com",
      contact: "+94701234567",
      occupation: "Engineer",
      address: "123 Main Street, Colombo 3",
      type: "father",
    },
    {
      id: 2,
      firstName: "Maria",
      lastName: "Perera",
      nic: "987654321V",
      email: "maria@example.com",
      contact: "+94702345678",
      occupation: "Doctor",
      address: "456 Oak Avenue, Colombo 5",
      type: "mother",
    },
    {
      id: 3,
      firstName: "Robert",
      lastName: "Jayasinghe",
      nic: "555666777V",
      email: "robert@example.com",
      contact: "+94703456789",
      occupation: "Businessman",
      address: "789 Elm Road, Colombo 7",
      type: "guardian",
    },
  ];

  // ==================== HANDLER FUNCTIONS ====================

  const handleParentChange = (e) => {
    const { name, value } = e.target;

    setParentData((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [name]: value,
      },
    }));
  };

  const handleChildChange = (e) => {
    const { name, value } = e.target;
    setChild((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchParent = () => {
    if (!searchNIC.trim()) {
      setSearchResults([]);
      return;
    }

    const results = existingParents.filter((p) =>
      p.nic.toLowerCase().includes(searchNIC.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSelectExistingParent = (parent) => {
    setSelectedExistingParents({
      ...selectedExistingParents,
      [parent.type]: parent,
    });
    setSearchNIC("");
    setSearchResults([]);
  };

  const handleRemoveExistingParent = (type) => {
    const newSelected = { ...selectedExistingParents };
    delete newSelected[type];
    setSelectedExistingParents(newSelected);
  };

  const generateTempPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Collect all filled new parents
    const filledNewParents = Object.entries(parentData)
      .filter(([_, parent]) => parent.firstName && parent.lastName && parent.nic && parent.contact)
      .map(([role, parent]) => ({
        ...parent,
        type: role,
        tempPassword: generateTempPassword(),
      }));

    // Collect selected existing parents
    const selectedExisting = Object.values(selectedExistingParents);

    // Combine all parents
    const allParents = [...filledNewParents, ...selectedExisting];

    // Validation
    if (allParents.length === 0) {
      alert("❌ Please add at least one parent/guardian.");
      return;
    }

    if (!child.firstName || !child.lastName || !child.dob || !child.enrollmentDate) {
      alert("❌ Please fill all required child fields.");
      return;
    }

    // Prepare data
    const registrationData = {
      child: {
        firstName: child.firstName,
        lastName: child.lastName,
        dob: child.dob,
        gender: child.gender,
        address: child.address,
        bloodType: child.bloodType,
        medicalConditions: child.medicalConditions,
        enrollmentDate: child.enrollmentDate,
        programName: child.programName,
      },
      parents: allParents,
      timestamp: new Date().toISOString(),
    };

    try {
      // TODO: Replace with actual backend API call
      // const response = await fetch("/api/admin/register-child-parents", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(registrationData),
      // });

      console.log("Registration data:", registrationData);

      let message = "✅ Child & Parents registered successfully!\n\n";
      message += "Registered Parents:\n";
      allParents.forEach((parent) => {
        message += `\n👤 ${parent.firstName} ${parent.lastName} (${parent.type})`;
        if (parent.tempPassword) {
          message += `\n   Password: ${parent.tempPassword}`;
        }
      });

      alert(message);

      // Reset form
      setParentMode("new");
      setSelectedRole("father");
      setParentData({
        father: {
          firstName: "",
          lastName: "",
          nic: "",
          contact: "",
          email: "",
          occupation: "",
          address: "",
        },
        mother: {
          firstName: "",
          lastName: "",
          nic: "",
          contact: "",
          email: "",
          occupation: "",
          address: "",
        },
        guardian: {
          firstName: "",
          lastName: "",
          nic: "",
          contact: "",
          email: "",
          occupation: "",
          address: "",
        },
      });
      setSearchNIC("");
      setSearchResults([]);
      setSelectedExistingParents({});
      setChild({
        firstName: "",
        lastName: "",
        dob: "",
        address: "",
        age: "",
        gender: "Male",
        bloodType: "",
        medicalConditions: "",
        enrollmentDate: "",
        programName: "",
      });

      navigate("/admin/children");
    } catch (error) {
      console.error("Registration error:", error);
      alert("❌ Error during registration. Please try again.");
    }
  };

  const currentParentData = parentData[selectedRole];

  // ==================== RENDER ====================

  return (
    <div className="ac-container">
      <main className="ac-main">
        <div className="ac-header">
          <h1>Register Child & Parents</h1>
          <p>
            Add a new child to the system and register their parents/guardians
          </p>
        </div>

        <form onSubmit={handleRegister} className="ac-form">
          {/* ==================== PARENT REGISTRATION SECTION ==================== */}
          <div className="ac-section-card">
            <div className="ac-section-header">
              <h2>Parent/Guardian Registration</h2>
              <p>Fill in details for each parent type (Father, Mother, Guardian)</p>
            </div>

            {/* MODE SELECTOR - Add New or Existing Parent */}
            <div className="ac-mode-selector">
              <button
                type="button"
                className={`ac-mode-btn ${parentMode === "new" ? "active" : ""}`}
                onClick={() => setParentMode("new")}
              >
                ➕ Add New Parent
              </button>
              <button
                type="button"
                className={`ac-mode-btn ${parentMode === "existing" ? "active" : ""}`}
                onClick={() => setParentMode("existing")}
              >
                🔍 Existing Parent
              </button>
            </div>

            {/* ==================== NEW PARENT FORM ==================== */}
            {parentMode === "new" && (
              <>
                {/* ROLE SELECTOR TABS */}
                <div className="ac-role-buttons">
                  <button
                    type="button"
                    className={`ac-role-btn ${selectedRole === "father" ? "active" : ""}`}
                    onClick={() => setSelectedRole("father")}
                  >
                    👨 Father
                  </button>
                  <button
                    type="button"
                    className={`ac-role-btn ${selectedRole === "mother" ? "active" : ""}`}
                    onClick={() => setSelectedRole("mother")}
                  >
                    👩 Mother
                  </button>
                  <button
                    type="button"
                    className={`ac-role-btn ${selectedRole === "guardian" ? "active" : ""}`}
                    onClick={() => setSelectedRole("guardian")}
                  >
                    🛡️ Guardian
                  </button>
                </div>

                {/* PARENT FORM */}
                <div className="ac-parent-form">
                  <h3>{selectedRole.toUpperCase()} Information</h3>

                  <div className="ac-field-grid">
                <div className="ac-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={currentParentData.firstName}
                    onChange={handleParentChange}
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={currentParentData.lastName}
                    onChange={handleParentChange}
                    required
                  />
                </div>
              </div>

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>NIC / ID Number *</label>
                  <input
                    type="text"
                    name="nic"
                    placeholder="e.g., 123456789V"
                    value={currentParentData.nic}
                    onChange={handleParentChange}
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    name="contact"
                    placeholder="+94 701 234 567"
                    value={currentParentData.contact}
                    onChange={handleParentChange}
                    required
                  />
                </div>
              </div>

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={currentParentData.email}
                    onChange={handleParentChange}
                  />
                </div>
                <div className="ac-field">
                  <label>Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Enter occupation"
                    value={currentParentData.occupation}
                    onChange={handleParentChange}
                  />
                </div>
              </div>

              <div className="ac-field">
                <label>Residential Address</label>
                <textarea
                  name="address"
                  placeholder="Enter full residential address"
                  value={currentParentData.address}
                  onChange={handleParentChange}
                  rows="3"
                ></textarea>
              </div>

              <p className="ac-form-hint">
                💡 Fill in the {selectedRole} details above. Click another parent tab to fill their details or leave empty to skip.
              </p>
                </div>
              </>
            )}

            {/* ==================== EXISTING PARENT SEARCH ==================== */}
            {parentMode === "existing" && (
              <>
                {/* Search Input */}
                <div className="ac-subsection">
                  <label className="ac-subsection-label">Search by NIC/ID Number</label>
                  <div className="ac-search-group">
                    <input
                      type="text"
                      placeholder="Enter NIC number (e.g., 123456789V)"
                      value={searchNIC}
                      onChange={(e) => setSearchNIC(e.target.value)}
                      className="ac-search-input"
                    />
                    <button
                      type="button"
                      className="ac-search-btn"
                      onClick={handleSearchParent}
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="ac-subsection">
                    <label className="ac-subsection-label">Search Results</label>
                    <div className="ac-results-list">
                      {searchResults.map((result) => (
                        <div key={result.id} className="ac-result-card">
                          <div className="ac-result-header">
                            <div>
                              <h4>{result.firstName} {result.lastName}</h4>
                              <span className="ac-result-type">{result.type}</span>
                            </div>
                            <button
                              type="button"
                              className="ac-result-select-btn"
                              onClick={() => handleSelectExistingParent(result)}
                            >
                              ✓ Select
                            </button>
                          </div>
                          <p className="ac-result-info">📋 NIC: {result.nic}</p>
                          <p className="ac-result-info">📞 {result.contact}</p>
                          <p className="ac-result-info">💼 {result.occupation}</p>
                          <p className="ac-result-info">📍 {result.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchNIC && searchResults.length === 0 && (
                  <div className="ac-no-results">
                    ❌ No parents found with that NIC number.
                  </div>
                )}

                {/* Selected Existing Parents */}
                {Object.keys(selectedExistingParents).length > 0 && (
                  <div className="ac-subsection">
                    <label className="ac-subsection-label">Selected Parents</label>
                    <div className="ac-selected-parents-grid">
                      {Object.values(selectedExistingParents).map((parent) => (
                        <div key={parent.id} className="ac-selected-parent-card">
                          <div className="ac-selected-header">
                            <div>
                              <h4>{parent.firstName} {parent.lastName}</h4>
                              <span className="ac-parent-badge">{parent.type}</span>
                            </div>
                            <button
                              type="button"
                              className="ac-remove-btn"
                              onClick={() => handleRemoveExistingParent(parent.type)}
                            >
                              ✕
                            </button>
                          </div>
                          <p><strong>NIC:</strong> {parent.nic}</p>
                          <p><strong>Contact:</strong> {parent.contact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ==================== CHILD REGISTRATION SECTION ==================== */}
          <div className="ac-section-card">
            <div className="ac-section-header">
              <h2>Child Registration</h2>
              <p>Add child's personal and enrollment information</p>
            </div>

            {/* Personal Information */}
            <div className="ac-subsection">
              <label className="ac-subsection-label">Personal Information</label>
              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter child's first name"
                    value={child.firstName}
                    onChange={handleChildChange}
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter child's last name"
                    value={child.lastName}
                    onChange={handleChildChange}
                    required
                  />
                </div>
              </div>

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={child.dob}
                    onChange={handleChildChange}
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    value={child.age}
                    onChange={handleChildChange}
                  />
                </div>
              </div>

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>Gender</label>
                  <div className="ac-gender-selector">
                    <button
                      type="button"
                      className={`ac-gender-btn ${child.gender === "Male" ? "active" : ""}`}
                      onClick={() => setChild({ ...child, gender: "Male" })}
                    >
                      👦 Male
                    </button>
                    <button
                      type="button"
                      className={`ac-gender-btn ${child.gender === "Female" ? "active" : ""}`}
                      onClick={() => setChild({ ...child, gender: "Female" })}
                    >
                      👧 Female
                    </button>
                  </div>
                </div>
                <div className="ac-field">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter residential address"
                    value={child.address}
                    onChange={handleChildChange}
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="ac-subsection">
              <label className="ac-subsection-label">Health & Medical Information</label>
              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>Blood Type</label>
                  <input
                    type="text"
                    name="bloodType"
                    placeholder="e.g., A+, B-, O+"
                    value={child.bloodType}
                    onChange={handleChildChange}
                  />
                </div>
                <div className="ac-field">
                  <label>Medical Conditions</label>
                  <input
                    type="text"
                    name="medicalConditions"
                    placeholder="e.g., Asthma, Allergies"
                    value={child.medicalConditions}
                    onChange={handleChildChange}
                  />
                </div>
              </div>
            </div>

            {/* Enrollment Information */}
            <div className="ac-subsection">
              <label className="ac-subsection-label">Enrollment Information</label>
              <div className="ac-field-grid">
                <div className="ac-field">
                  <label>Enrollment Date *</label>
                  <input
                    type="date"
                    name="enrollmentDate"
                    value={child.enrollmentDate}
                    onChange={handleChildChange}
                    required
                  />
                </div>
                <div className="ac-field">
                  <label>Program *</label>
                  <select
                    name="programName"
                    value={child.programName}
                    onChange={handleChildChange}
                    required
                  >
                    <option value="">Select Program</option>
                    <option value="Playgroup">Playgroup</option>
                    <option value="Pre-Nursery">Pre-Nursery</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Reception">Reception</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="ac-button-group">
            <button
              type="button"
              className="ac-btn-cancel"
              onClick={() => navigate("/admin/children")}
            >
              ← Cancel
            </button>
            <button type="submit" className="ac-btn-submit">
              ✓ Register Child & Parents
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
