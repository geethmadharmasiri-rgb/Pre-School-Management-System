import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./AddTeacher.css"; // Removed custom CSS

export default function AddTeacher() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState(null);

  const [teacher, setTeacher] = useState({
    name: "", empId: "", email: "", contact: "", nic: "", qualification: "", experience: "", address: "",
  });

  const generateCredentials = () => {
    const newId = "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const newPassword = "Pw" + Math.random().toString(36).slice(-6); // EXACTLY 8 chars: 'Pw' + 6 random
    setCredentials({ teacherId: newId, tempPassword: newPassword });
    setTeacher(prev => ({ ...prev, empId: newId }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!credentials) {
      alert("Please generate credentials before registering.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...teacher,
          password: credentials.tempPassword,
        }),
      });

      if (res.ok) {
        alert("Teacher registered successfully!");
        navigate("/admin/teachers");
      } else {
        const data = await res.json();
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };


  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Add New Teacher</h1>
          <p className="ad-header-subtitle">Onboard a new staff member</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="ad-form-card" style={{ maxWidth: '800px', margin: '0 auto' }}>

        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ad-text-primary)' }}>Personal Information</h2>
        <div className="ad-form-row">
          <div className="ad-form-group">
            <label>Full Name *</label>
            <input className="ad-input" value={teacher.name} onChange={e => setTeacher({ ...teacher, name: e.target.value })} required />
          </div>
          <div className="ad-form-group">
            <label>Employee ID</label>
            <input className="ad-input" value={teacher.empId} placeholder="Generated automatically" readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} />
          </div>
        </div>

        <div className="ad-form-row">
          <div className="ad-form-group">
            <label>NIC *</label>
            <input className="ad-input" value={teacher.nic} onChange={e => setTeacher({ ...teacher, nic: e.target.value })} required />
          </div>
          <div className="ad-form-group">
            <label>Email *</label>
            <input type="email" className="ad-input" value={teacher.email} onChange={e => setTeacher({ ...teacher, email: e.target.value })} required />
            <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Login credentials will be sent to this email
            </small>
          </div>
        </div>

        <div className="ad-form-row">
          <div className="ad-form-group">
            <label>Contact Number</label>
            <input className="ad-input" value={teacher.contact} onChange={e => setTeacher({ ...teacher, contact: e.target.value })} />
          </div>
          <div className="ad-form-group">
            <label>Address</label>
            <input className="ad-input" value={teacher.address} onChange={e => setTeacher({ ...teacher, address: e.target.value })} />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ad-text-primary)' }}>Professional Details</h2>
        <div className="ad-form-row">
          <div className="ad-form-group">
            <label>Qualification</label>
            <input className="ad-input" value={teacher.qualification} onChange={e => setTeacher({ ...teacher, qualification: e.target.value })} />
          </div>
          <div className="ad-form-group">
            <label>Experience (Years)</label>
            <input type="number" className="ad-input" value={teacher.experience} onChange={e => setTeacher({ ...teacher, experience: e.target.value })} />
          </div>
        </div>

        <div className="ad-card" style={{ marginTop: '24px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#047857', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Auto-Generated Credentials</h3>

          {!credentials ? (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <p style={{ color: '#059669', marginBottom: '12px', fontSize: '14px' }}>Generate unique login credentials for this teacher.</p>
              <button type="button" className="btn-primary" onClick={generateCredentials} style={{ backgroundColor: '#059669' }}>
                Generate Credentials
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>ID</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{credentials.teacherId}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Password</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{credentials.tempPassword}</p>
              </div>
            </div>
          )}
        </div>

        <div className="ad-form-actions" style={{ marginTop: '32px' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/teachers")}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!credentials} style={{ opacity: !credentials ? 0.6 : 1, cursor: !credentials ? 'not-allowed' : 'pointer' }}>Register Teacher</button>
        </div>
      </form>
    </div>
  );
}
