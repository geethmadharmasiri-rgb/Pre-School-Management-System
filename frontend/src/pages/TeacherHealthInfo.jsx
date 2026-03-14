import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherHealthInfo() {
    const { selectedYearId } = useOutletContext();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChild, setSelectedChild] = useState(null);
    const [editForm, setEditForm] = useState({
        allergies: "",
        medications: "",
        health_notes: "",          // parent's notes (read-only for teacher)
        teacher_health_notes: "",  // teacher's own notes (editable)
        medical_conditions: "",
        blood_type: ""
    });

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
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setChildren(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (child) => {
        setSelectedChild(child);
        setEditForm({
            allergies: child.allergies || "None",
            medications: child.medications || "None",
            health_notes: child.health_notes || "",
            teacher_health_notes: child.teacher_health_notes || "",
            medical_conditions: child.medical_conditions || "",
            blood_type: child.blood_type || ""
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/children/${selectedChild.id}/health-info`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ teacher_health_notes: editForm.teacher_health_notes })
            });

            if (res.ok) {
                alert("Health note saved!");
                setSelectedChild(null);
                fetchChildren();
            } else {
                alert("Failed to update.");
            }
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Health Information</h1>
                    <p className="ad-header-subtitle">Important health notes and allergies</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="table-container">
                {loading ? <p>Loading...</p> : (
                    <table className="ad-table">
                        <thead>
                            <tr>
                                <th>Child</th>
                                <th>Allergies</th>
                                <th>Medication</th>
                                <th>Last Updated</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {children.map(child => {
                                const isRecentlyUpdated = child.health_updated_at && (new Date() - new Date(child.health_updated_at)) < 48 * 60 * 60 * 1000;
                                return (
                                    <tr key={child.id} style={{ backgroundColor: isRecentlyUpdated ? '#f0f9ff' : 'inherit' }}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {child.first_name} {child.last_name}
                                                {isRecentlyUpdated && (
                                                    <span style={{
                                                        backgroundColor: '#0ea5e9', color: 'white', fontSize: '10px',
                                                        padding: '2px 6px', borderRadius: '4px', fontWeight: 700
                                                    }}>NEW</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                color: child.allergies && child.allergies !== "None" ? '#ef4444' : 'inherit',
                                                fontWeight: child.allergies && child.allergies !== "None" ? 600 : 400
                                            }}>
                                                {child.allergies || "None"}
                                            </span>
                                        </td>
                                        <td>{child.medications || "None"}</td>
                                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                                            {child.health_updated_at ? new Date(child.health_updated_at).toLocaleDateString() : "Never"}
                                        </td>
                                        <td>
                                            <button className="btn-primary btn-small" onClick={() => handleViewDetails(child)}>View Details</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {children.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No children found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* EDIT MODAL */}
            {selectedChild && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Health Profile: {selectedChild.first_name}</h2>

                        <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                            <p style={{ margin: 0 }}><strong>Emergency Contact:</strong> {selectedChild.contactNumber || "N/A"}</p>
                            <p style={{ margin: '4px 0 0 0' }}><strong>Parent:</strong> {selectedChild.parentName || "N/A"}</p>
                        </div>

                        <form onSubmit={handleUpdate}>
                            {/* READ-ONLY: Parent-supplied medical info */}
                            <div style={{
                                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: '10px', padding: '14px', marginBottom: '16px'
                            }}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    📋 Medical Info (provided by Parent)
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {[
                                        { label: 'BLOOD TYPE', value: editForm.blood_type },
                                        { label: 'ALLERGIES', value: editForm.allergies, alert: editForm.allergies && editForm.allergies !== 'None' },
                                        { label: 'MEDICAL CONDITIONS', value: editForm.medical_conditions },
                                        { label: 'MEDICATION', value: editForm.medications },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{item.label}</p>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: item.alert ? '#ef4444' : '#334155' }}>
                                                {item.value || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not specified</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DUAL NOTES SECTION */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

                                {/* Parent's Notes - READ ONLY */}
                                <div style={{
                                    border: '2px solid #bfdbfe', borderRadius: '10px',
                                    padding: '12px', backgroundColor: '#eff6ff'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>👨‍👩‍👧</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1d4ed8' }}>Parent's Notes</span>
                                        <span style={{
                                            fontSize: '9px', backgroundColor: '#dbeafe', color: '#1d4ed8',
                                            padding: '1px 6px', borderRadius: '99px', fontWeight: 700, marginLeft: 'auto'
                                        }}>View Only</span>
                                    </div>
                                    <p style={{
                                        margin: 0, fontSize: '13px', color: '#334155',
                                        whiteSpace: 'pre-wrap', lineHeight: '1.5',
                                        minHeight: '60px',
                                        fontStyle: editForm.health_notes ? 'normal' : 'italic',
                                        color: editForm.health_notes ? '#334155' : '#94a3b8'
                                    }}>
                                        {editForm.health_notes || 'No notes from parent yet.'}
                                    </p>
                                </div>

                                {/* Teacher's Notes - EDITABLE */}
                                <div style={{
                                    border: '2px solid #bbf7d0', borderRadius: '10px',
                                    padding: '12px', backgroundColor: '#f0fdf4'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>👩‍🏫</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#15803d' }}>Teacher's Notes</span>
                                        <span style={{
                                            fontSize: '9px', backgroundColor: '#dcfce7', color: '#15803d',
                                            padding: '1px 6px', borderRadius: '99px', fontWeight: 700, marginLeft: 'auto'
                                        }}>Editable</span>
                                    </div>
                                    <textarea
                                        style={{
                                            width: '100%', border: '1px solid #86efac', borderRadius: '6px',
                                            padding: '8px', fontSize: '13px', resize: 'vertical',
                                            backgroundColor: 'white', color: '#334155', lineHeight: '1.5',
                                            minHeight: '60px', boxSizing: 'border-box', fontFamily: 'inherit'
                                        }}
                                        value={editForm.teacher_health_notes}
                                        onChange={e => setEditForm({ ...editForm, teacher_health_notes: e.target.value })}
                                        placeholder="Add your health observations here..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setSelectedChild(null)}>Close</button>
                                <button type="submit" className="btn-primary">💾 Save My Note</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
