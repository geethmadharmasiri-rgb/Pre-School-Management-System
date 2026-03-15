import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

const ChildManagement = () => {
  const navigate = useNavigate();
  const { selectedYearId } = useOutletContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", dob: "", gender: "Male",
    address: "", enrollment_date: "", program_name: "", class_id: ""
  });
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeChildForQR, setActiveChildForQR] = useState(null);

  useEffect(() => {
    if (selectedYearId) {
      fetchChildren();
    }
  }, [selectedYearId]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/children?yearId=${selectedYearId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Fetch children error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddChild = () => {
    navigate("/admin/children/new");
  };

  const handleEditChild = (child) => {
    setEditingId(child.id);
    setFormData(child);
    setBirthCertificate(null);
    setShowForm(true);
  };

  const handleDeleteChild = async (id) => {
    if (window.confirm("Are you sure you want to delete this child?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/children/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchChildren();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = editingId
        ? `http://localhost:5000/api/children/${editingId}`
        : `http://localhost:5000/api/children`;

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) data.append(key, formData[key]);
      });
      if (birthCertificate) {
        data.append("birthCertificate", birthCertificate);
      }
      if (selectedYearId) {
        data.append("academic_year_id", selectedYearId);
      }

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        alert(editingId ? "Child updated!" : "Child added!");
        setShowForm(false);
        fetchChildren();
      } else {
        const err = await res.json();
        alert(err.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Connectivity error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (path) => {
    if (!path) return;
    const cleanPath = path.replace(/\\/g, '/');
    window.open(`http://localhost:5000/${cleanPath}`, '_blank');
  };

  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Child Management</h1>
          <p className="ad-header-subtitle">Manage child records and information</p>
        </div>
        <div className="notification">{Icons.bell}</div>
      </header>

      <div className="filters-section">
        <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ width: '20px', color: '#94a3b8' }}>{Icons.search}</span>
          <input
            type="text"
            placeholder="Search child by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-input"
            style={{ border: 'none', background: 'transparent', padding: '0' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate("/admin/parents")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.parent} Approvals
          </button>
          <button className="btn-secondary" onClick={() => navigate("/admin/classes")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.class} Class Allocation
          </button>
          <button className="btn-primary" onClick={handleAddChild}>
            {Icons.plus} Add Child
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Class</th>
              <th>Parents</th>
              <th>Contacts</th>
              <th style={{ textAlign: 'center' }}>QR Code</th>
              <th style={{ textAlign: 'center' }}>Birth Certificate</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChildren.map((child) => (
              <tr key={child.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {child.profile_picture ? (
                        <img src={`http://localhost:5000/${child.profile_picture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '16px' }}>{child.gender === 'Female' ? '👧' : '👦'}</span>
                      )}
                    </div>
                    <span style={{ fontWeight: 500 }}>{child.first_name} {child.last_name}</span>
                  </div>
                </td>
                <td>{child.dob ? (new Date().getFullYear() - new Date(child.dob).getFullYear()) : "N/A"}</td>
                <td>{child.className || "Unassigned"}</td>
                <td>
                  <div style={{ fontSize: '13px' }}>{child.parentName || "N/A"}</div>
                </td>
                <td>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{child.contactNumber || "N/A"}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="action-btn"
                    style={{
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveChildForQR(child);
                      setShowQRModal(true);
                    }}
                  >
                    {Icons.search && <span style={{ width: '14px', height: '14px' }}>{Icons.search}</span>}
                    QR Code
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {child.birth_certificate ? (
                    <button
                      className="action-btn view"
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                      onClick={() => handleViewCertificate(child.birth_certificate)}
                      title="View Birth Certificate"
                    >
                      📄 Doc
                    </button>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '11px', fontStyle: 'italic' }}>No File</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="action-btn edit" style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px' }} onClick={() => handleEditChild(child)}>Edit</button>
                    <button className="action-btn delete" style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px' }} onClick={() => handleDeleteChild(child.id)}>Delete</button>
                  </div>
                </td>

              </tr>
            ))}
            {filteredChildren.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No children found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="ad-form-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{editingId ? "Edit Child" : "Add Child"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ad-form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  className="ad-input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="ad-form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  className="ad-input"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    className="ad-input"
                    value={formData.dob ? (formData.dob.includes('T') ? formData.dob.split('T')[0] : formData.dob) : ""}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
                <div className="ad-form-group">
                  <label>Gender</label>
                  <select
                    className="ad-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="ad-form-group">
                <label>Address</label>
                <textarea
                  className="ad-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="ad-form-group">
                <label>Birth Certificate</label>
                <input
                  type="file"
                  className="ad-input"
                  onChange={(e) => setBirthCertificate(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {editingId && formData.birth_certificate && !birthCertificate && (
                  <small style={{ color: '#10b981' }}>Current file: {formData.birth_certificate.split('\\').pop()}</small>
                )}
              </div>

              <div className="ad-form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  className="ad-input"
                  value={formData.program_name || ""}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="e.g. Montessori"
                />
              </div>


              <div className="ad-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Child" : "Add Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && activeChildForQR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1010
        }}>
          <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <h2 style={{ marginBottom: '10px' }}>Child Digital ID</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Permanent QR code for <strong>{activeChildForQR.first_name} {activeChildForQR.last_name}</strong>
            </p>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'inline-block',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              {/* Using a public QR generator API for MVP demonstration */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ILA-CH-${activeChildForQR.id}`}
                alt="Child QR Code"
                style={{ width: '200px', height: '200px' }}
              />
            </div>

            <p style={{ marginTop: '15px', fontWeight: 600, color: '#10b981' }}>ILA-CH-{String(activeChildForQR.id).padStart(3, '0')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  alert(`QR Code successfully sent to parent: ${activeChildForQR.parentName || 'Guardian'}`);
                }}
              >
                Send to Parent (Email/App)
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => window.print()}
              >
                Download & Print
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', border: 'none' }}
                onClick={() => setShowQRModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildManagement;
