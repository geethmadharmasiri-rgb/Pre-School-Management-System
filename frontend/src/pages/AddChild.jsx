import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";
// import "./AddChild.css"; // Removed custom CSS

export default function AddChild() {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================
  const [parentMode, setParentMode] = useState("new");
  const [selectedRole, setSelectedRole] = useState("father");

  const [parentData, setParentData] = useState({
    father: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
    mother: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
    guardian: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
  });

  const [child, setChild] = useState({
    firstName: "", lastName: "", dob: "", address: "", age: "", gender: "Male",
    bloodType: "", medicalConditions: "", allergies: "", medications: "", health_notes: "", enrollmentDate: "", programName: "",
  });

  // Existing parent search
  const [searchNIC, setSearchNIC] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExistingParents, setSelectedExistingParents] = useState({});

  // No mock data needed anymore
  const [loading, setLoading] = useState(false);


  const [birthCertificate, setBirthCertificate] = useState(null);

  // ==================== HANDLERS ====================
  const handleParentChange = (e) => {
    const { name, value } = e.target;
    setParentData((prev) => ({
      ...prev,
      [selectedRole]: { ...prev[selectedRole], [name]: value },
    }));
  };

  const handleChildChange = (e) => {
    const { name, value } = e.target;
    setChild((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchParent = async () => {
    if (!searchNIC.trim()) { setSearchResults([]); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/parents/search?nic=${searchNIC}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectExistingParent = (parent) => {
    setSelectedExistingParents({ ...selectedExistingParents, [parent.type]: parent });
    setSearchNIC("");
    setSearchResults([]);
  };

  const handleRemoveExistingParent = (type) => {
    const newSelected = { ...selectedExistingParents };
    delete newSelected[type];
    setSelectedExistingParents(newSelected);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Prepare parents array
      const parentsArray = [];

      // Add existing parents (already in the array)
      Object.keys(selectedExistingParents).forEach(type => {
        const p = selectedExistingParents[type];
        parentsArray.push({
          id: p.id,
          email: p.email,
          nic: p.nic,
          type: type // father/mother/guardian
        });
      });

      // Add new parents that have been filled out in the form
      if (parentMode === 'new') {
        ['father', 'mother', 'guardian'].forEach(role => {
          const data = parentData[role];
          // Only add if at least firstName, NIC, and Email are provided
          if (data.firstName && data.nic && data.email) {
            // Generate a random temp password if not provided
            const tempPass = Math.random().toString(36).slice(-8);

            parentsArray.push({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              nic: data.nic,
              contact: data.contact,
              address: data.address,
              occupation: data.occupation,
              type: role,
              tempPassword: tempPass
            });
          }
        });
      }

      if (parentsArray.length === 0) {
        alert("Please add at least one parent/guardian with required details (First Name, NIC, Email)");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("child", JSON.stringify(child));
      formData.append("parents", JSON.stringify(parentsArray));
      if (birthCertificate) {
        formData.append("birthCertificate", birthCertificate);
      }

      const res = await fetch("http://localhost:5000/api/admin/register-child-parents", {
        method: "POST",
        headers: {
          // "Content-Type": "application/json", // Remove Content-Type for FormData
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        let msg = "Child and parents registered successfully!\n\n🆕 For the first login, parents should click 'Forgot Password' on the login page and verify their NIC and Email.";

        // Show temp passwords for new accounts
        const newParents = parentsArray.filter(p => !p.id);
        if (newParents.length > 0) {
          msg += "\n\n🔑 Temporary passwords created:";
          newParents.forEach(p => {
            msg += `\n- ${p.type.toUpperCase()} (${p.firstName}): ${p.tempPassword}`;
          });
        }

        alert(msg);
        navigate("/admin/children");
      } else {
        const err = await res.json();
        alert(err.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Connectivity error");
    } finally {
      setLoading(false);
    }
  };


  const currentParentData = parentData[selectedRole];

  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Register New Child</h1>
          <p className="ad-header-subtitle">Enroll a new child and assign parents/guardians</p>
        </div>
      </header>

      <form onSubmit={handleRegister} className="ad-form-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* PARENT SECTION */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ad-text-primary)' }}>Parent/Guardian Details</h2>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button"
              className={parentMode === 'new' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setParentMode("new")}
            >
              Add New Parent
            </button>
            <button type="button"
              className={parentMode === 'existing' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setParentMode("existing")}
            >
              Existing Parent
            </button>
          </div>

          {parentMode === 'new' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                {['father', 'mother', 'guardian'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    style={{
                      background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
                      fontWeight: 600, color: selectedRole === role ? 'var(--ad-accent)' : '#64748b',
                      borderBottom: selectedRole === role ? '2px solid var(--ad-accent)' : 'none'
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>

              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>First Name</label>
                  <input className="ad-input" name="firstName" value={currentParentData.firstName} onChange={handleParentChange} />
                </div>
                <div className="ad-form-group">
                  <label>Last Name</label>
                  <input className="ad-input" name="lastName" value={currentParentData.lastName} onChange={handleParentChange} />
                </div>
              </div>
              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>NIC</label>
                  <input className="ad-input" name="nic" value={currentParentData.nic} onChange={handleParentChange} />
                </div>
                <div className="ad-form-group">
                  <label>Contact</label>
                  <input className="ad-input" name="contact" value={currentParentData.contact} onChange={handleParentChange} />
                </div>
              </div>

              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>Email Address</label>
                  <input className="ad-input" type="email" name="email" value={currentParentData.email} onChange={handleParentChange} />
                </div>
                <div className="ad-form-group">
                  <label>Occupation</label>
                  <input className="ad-input" name="occupation" value={currentParentData.occupation} onChange={handleParentChange} />
                </div>
              </div>

              <div className="ad-form-group">
                <label>Address</label>
                <textarea
                  className="ad-input"
                  name="address"
                  value={currentParentData.address}
                  onChange={handleParentChange}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>
            </>
          )}

          {parentMode === 'existing' && (
            <div className="ad-form-group">
              <label>Search Parent by NIC</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="ad-input" placeholder="Enter NIC..." value={searchNIC} onChange={e => setSearchNIC(e.target.value)} />
                <button type="button" className="btn-primary" onClick={handleSearchParent}>Search</button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

        {/* CHILD SECTION */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ad-text-primary)' }}>Child Information</h2>

          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>First Name *</label>
              <input className="ad-input" name="firstName" value={child.firstName} onChange={handleChildChange} required />
            </div>
            <div className="ad-form-group">
              <label>Last Name *</label>
              <input className="ad-input" name="lastName" value={child.lastName} onChange={handleChildChange} required />
            </div>
          </div>

          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>Date of Birth *</label>
              <input type="date" className="ad-input" name="dob" value={child.dob} onChange={handleChildChange} required />
            </div>
            <div className="ad-form-group">
              <label>Gender</label>
              <select className="ad-select" name="gender" value={child.gender} onChange={handleChildChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>Birth Certificate</label>
              <input type="file" className="ad-input" name="birthCertificate" onChange={(e) => setBirthCertificate(e.target.files[0])} />
            </div>
            <div className="ad-form-group">
              <label>Enrollment Date</label>
              <input type="date" className="ad-input" name="enrollmentDate" value={child.enrollmentDate} onChange={handleChildChange} />
            </div>
          </div>

          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>Program Name</label>
              <input className="ad-input" name="programName" value={child.programName} onChange={handleChildChange} placeholder="e.g. Montessori, Playgroup" />
            </div>
            <div className="ad-form-group">
              <label>Home Address</label>
              <input className="ad-input" name="address" value={child.address} onChange={handleChildChange} placeholder="Enter home address" />
            </div>
          </div>

          <h3 style={{ fontSize: '16px', margin: '24px 0 16px 0', color: 'var(--ad-text-primary)' }}>Health Information (Optional)</h3>
          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>Blood Type</label>
              <select className="ad-input" name="bloodType" value={child.bloodType} onChange={handleChildChange}>
                <option value="">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="ad-form-group">
              <label>Allergies</label>
              <input className="ad-input" name="allergies" value={child.allergies} onChange={handleChildChange} placeholder="e.g. Peanuts, Dairy" />
            </div>
          </div>

          <div className="ad-form-row">
            <div className="ad-form-group">
              <label>Medical Conditions</label>
              <input className="ad-input" name="medicalConditions" value={child.medicalConditions} onChange={handleChildChange} placeholder="e.g. Asthma, Diabetes" />
            </div>
            <div className="ad-form-group">
              <label>Medications</label>
              <input className="ad-input" name="medications" value={child.medications} onChange={handleChildChange} placeholder="e.g. Inhaler" />
            </div>
          </div>

          <div className="ad-form-group">
            <label>Health Notes</label>
            <textarea className="ad-input" name="health_notes" value={child.health_notes} onChange={handleChildChange} rows={3} placeholder="Any other health concerns or notes..." />
          </div>

        </div>

        <div className="ad-form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/children")}>Cancel</button>
          <button type="submit" className="btn-primary">Register child</button>
        </div>
      </form >
    </div >
  );
}
