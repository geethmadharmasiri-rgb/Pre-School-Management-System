import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";
// import "./AddChild.css"; // Removed custom CSS

export default function AddChild() {
  const navigate = useNavigate();
  const { selectedYearId } = useOutletContext();

  // ==================== STATE MANAGEMENT ====================
  const [parentMode, setParentMode] = useState("new");
  const [selectedRole, setSelectedRole] = useState("father");

  const [parentData, setParentData] = useState({
    father: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
    mother: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
    guardian: { firstName: "", lastName: "", nic: "", contact: "", email: "", occupation: "", address: "" },
  });

  const [child, setChild] = useState({
    firstName: "", lastName: "", dob: "", address: "", gender: "Male",
    enrollmentDate: "", programName: "",
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


  const handleSelectExistingParent = (parent, role) => {
    // Check if this parent ID is already assigned to another role
    const isAlreadyAssigned = Object.values(selectedExistingParents).some(p => p.id === parent.id);
    if (isAlreadyAssigned) {
      alert(`This person (${parent.name}) is already selected for another role. One person cannot be assigned to multiple parent/guardian roles.`);
      return;
    }

    setSelectedExistingParents({ ...selectedExistingParents, [role]: parent });
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

      // Add existing parents
      Object.keys(selectedExistingParents).forEach(role => {
        const p = selectedExistingParents[role];
        parentsArray.push({
          id: p.id,
          email: p.email,
          nic: p.nic,
          type: role // father/mother/guardian
        });
      });

      // Add new parents that have been filled out in the form (ONLY IF IN NEW MODE)
      if (parentMode === 'new') {
        ['father', 'mother', 'guardian'].forEach(role => {
          const data = parentData[role];
          if (selectedExistingParents[role]) return;

          if (data.firstName && data.nic && data.email) {
            // Check for duplicate NIC or Email within the parents being added
            const isDuplicateNIC = parentsArray.some(p => p.nic === data.nic.trim());
            const isDuplicateEmail = parentsArray.some(p => p.email === data.email.trim());

            if (isDuplicateNIC || isDuplicateEmail) {
              // We'll throw an error to catch it in the try block
              throw new Error(`Duplicate entry found. The NIC or Email for the ${role} is already assigned to another selected parent.`);
            }

            const tempPass = Math.random().toString(36).slice(-8);
            parentsArray.push({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email.trim(),
              nic: data.nic.trim(),
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
        let errorMsg = "Please add at least one parent/guardian.";
        if (searchResults.length > 0) {
          errorMsg += "\n\n💡 TIP: You have search results! Please click one of the buttons (+ Father, + Mother, or + Guardian) next to the parent's name to link them to this child.";
        } else if (parentMode === 'existing') {
          errorMsg += "\n\nFirst search for the parent using their NIC, then click the role button to assign them.";
        }
        alert(errorMsg);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("child", JSON.stringify(child));
      formData.append("parents", JSON.stringify(parentsArray));
      if (selectedYearId) {
        formData.append("academicYearId", selectedYearId);
      }
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
            <div className="existing-parent-section" style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div className="ad-form-group">
                <label style={{ fontWeight: '600', color: '#475569' }}>Search Parent by NIC</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <input 
                    className="ad-input" 
                    placeholder="Enter NIC number (e.g. 199012345678)..." 
                    value={searchNIC} 
                    onChange={e => setSearchNIC(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchParent())}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn-primary" onClick={handleSearchParent} disabled={loading} style={{ minWidth: '100px' }}>
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className="search-results" style={{ 
                  marginTop: '16px', 
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                    Found {searchResults.length} parent{searchResults.length > 1 ? 's' : ''}
                  </div>
                  {searchResults.map(p => (
                    <div key={p.id} style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s'
                    }} className="hover:bg-slate-50">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>{p.name}</div>
                          {p.isPrimary ? (
                            <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MATCH</span>
                          ) : (
                            <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>FAMILY MEMBER</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span><strong>NIC:</strong> {p.nic}</span>
                          <span><strong>Email:</strong> {p.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                          {p.previousRoles && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Known as: <strong style={{ color: '#64748b' }}>{p.previousRoles}</strong> in system
                            </span>
                          )}
                          {p.occupation && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> • {p.occupation}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '2px', textAlign: 'center' }}>LINK AS:</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => handleSelectExistingParent(p, 'father')} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#10b981', border: 'none' }}>+ Father</button>
                          <button type="button" onClick={() => handleSelectExistingParent(p, 'mother')} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#ec4899', border: 'none' }}>+ Mother</button>
                          <button type="button" onClick={() => handleSelectExistingParent(p, 'guardian')} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#6366f1', border: 'none' }}>+ Guardian</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NO RESULTS MESSAGE */}
              {!loading && searchNIC && searchResults.length === 0 && (
                <div style={{ marginTop: '16px', textAlign: 'center', padding: '20px', color: '#64748b', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                  No parent found with NIC "{searchNIC}". Try another NIC or use "Add New Parent".
                </div>
              )}

              {/* SELECTED PARENTS DISPLAY */}
              {Object.keys(selectedExistingParents).length > 0 && (
                <div style={{ 
                  marginTop: '24px', 
                  padding: '16px', 
                  backgroundColor: 'white', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                    Selected Parents
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(selectedExistingParents).map(([role, p]) => (
                      <div key={role} style={{ 
                        background: '#f8fafc', 
                        padding: '10px 16px', 
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: `4px solid ${role === 'father' ? '#10b981' : role === 'mother' ? '#ec4899' : '#6366f1'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '700', textTransform: 'capitalize', color: '#475569', minWidth: '70px' }}>{role}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({p.nic})</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveExistingParent(role)}
                          style={{ 
                            background: '#fee2e2', 
                            border: 'none', 
                            color: '#ef4444', 
                            cursor: 'pointer', 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
                    * You can still fill in other parent roles in "Add New Parent" mode if needed.
                  </p>
                </div>
              )}
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

        </div>

        <div className="ad-form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/children")}>Cancel</button>
          <button type="submit" className="btn-primary">Register child</button>
        </div>
      </form >
    </div >
  );
}
