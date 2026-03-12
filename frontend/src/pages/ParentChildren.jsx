import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function ParentChildren() {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    // Enroll State
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollData, setEnrollData] = useState({ first_name: "", last_name: "", dob: "", gender: "Male" });

    // Edit Contact State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [contactData, setContactData] = useState({ phone: "", address: "" });

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/children", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const realChildren = Array.isArray(data) ? data : [];
            setChildren(realChildren);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/children", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(enrollData)
            });
            if (res.ok) {
                alert("Enrollment submitted and pending approval.");
                setShowEnrollModal(false);
                setEnrollData({ first_name: "", last_name: "", dob: "", gender: "Male" });
                fetchChildren();
            } else {
                alert("Enrollment failed.");
            }
        } catch (err) { console.error(err); }
    };

    const handleEditContact = (child) => {
        setEditingChild(child);
        setContactData({ phone: child.contactNumber || "", address: child.address || "" });
        setShowEditModal(true);
    };

    const saveContact = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/children/${editingChild.id}/contact`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(contactData),
            });
            if (res.ok) {
                alert("Contact updated!");
                setShowEditModal(false);
                fetchChildren(); // Refund updated data
            }
        } catch (err) { console.error(err); }
    };

    // "Login to Child Profile" simply navigates to the profile view
    const handleLoginToProfile = (childId) => {
        navigate(`/parent/child-profile/${childId}`);
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>My Children</h1>
                    <p className="ad-header-subtitle">Manage profiles and new enrollments</p>
                </div>
                <button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
                    {Icons.plus} Enroll New Child
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }}>
                {children.map((child) => (
                    <div key={child.id} className="ad-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px', background: 'linear-gradient(to right, #f8fafc, #fff)', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '40px', background: '#fff', width: '70px', height: '70px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                    border: '2px solid #e2e8f0', overflow: 'hidden'
                                }}>
                                    {child.profile_picture ? (
                                        <img src={`http://localhost:5000/${child.profile_picture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span>{child.gender === 'Female' ? '👧' : '👦'}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{child.first_name} {child.last_name}</h4>
                                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', marginTop: '6px', display: 'inline-block' }}>
                                        {child.className || "Pending Class"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', flex: 1 }}>
                            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#64748b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>DOB:</span>
                                    <span style={{ fontWeight: 500, color: '#334155' }}>{child.dob ? new Date(child.dob).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Status:</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: child.status === 'approved' ? '#16a34a' : child.status === 'rejected' ? '#dc2626' : '#d97706',
                                        backgroundColor: child.status === 'approved' ? '#dcfce7' : child.status === 'rejected' ? '#fee2e2' : '#ffedd5',
                                        padding: '2px 8px', borderRadius: '12px', fontSize: '13px'
                                    }}>
                                        {child.status ? child.status.charAt(0).toUpperCase() + child.status.slice(1) : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                style={{
                                    width: '100%', marginBottom: '12px', justifyContent: 'center',
                                    opacity: child.status !== 'approved' ? 0.6 : 1,
                                    cursor: child.status !== 'approved' ? 'not-allowed' : 'pointer',
                                    backgroundColor: child.status !== 'approved' ? '#94a3b8' : ''
                                }}
                                disabled={child.status !== 'approved'}
                                onClick={() => child.status === 'approved' && handleLoginToProfile(child.id)}
                            >
                                {child.status === 'approved' ? 'Login to Child Profile' : 'Access Pending'}
                            </button>

                            <button
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => handleEditContact(child)}
                            >
                                Edit Profile Details
                            </button>
                        </div>
                    </div>
                ))}

                {children.length === 0 && !loading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No children found. Please enroll a child.
                    </div>
                )}
            </div>

            {/* ENROLL MODAL */}
            {showEnrollModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Enroll Registration</h2>
                        <form onSubmit={handleEnroll}>
                            <div className="ad-form-group">
                                <label>First Name</label>
                                <input className="ad-input" value={enrollData.first_name} onChange={e => setEnrollData({ ...enrollData, first_name: e.target.value })} required />
                            </div>
                            <div className="ad-form-group">
                                <label>Last Name</label>
                                <input className="ad-input" value={enrollData.last_name} onChange={e => setEnrollData({ ...enrollData, last_name: e.target.value })} required />
                            </div>
                            <div className="ad-form-group">
                                <label>Date of Birth</label>
                                <input type="date" className="ad-input" value={enrollData.dob} onChange={e => setEnrollData({ ...enrollData, dob: e.target.value })} required />
                            </div>
                            <div className="ad-form-group">
                                <label>Gender</label>
                                <select className="ad-select" value={enrollData.gender} onChange={e => setEnrollData({ ...enrollData, gender: e.target.value })}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Submit Enrollment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT CONTACT MODAL */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h2>Edit Profile Details</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Update contact information for school records.</p>
                        <form onSubmit={saveContact}>
                            <div className="ad-form-group">
                                <label>Phone Number</label>
                                <input className="ad-input" value={contactData.phone} onChange={e => setContactData({ ...contactData, phone: e.target.value })} required />
                            </div>
                            <div className="ad-form-group">
                                <label>Address</label>
                                <textarea className="ad-input" rows={3} value={contactData.address} onChange={e => setContactData({ ...contactData, address: e.target.value })} required />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
