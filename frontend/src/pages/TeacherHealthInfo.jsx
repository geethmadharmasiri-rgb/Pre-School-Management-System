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
        health_notes: "",
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
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                alert("Health information updated!");
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="ad-form-group">
                                    <label>Blood Type</label>
                                    <select
                                        className="ad-input"
                                        value={editForm.blood_type}
                                        onChange={e => setEditForm({ ...editForm, blood_type: e.target.value })}
                                    >
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
                                    <input
                                        className="ad-input"
                                        value={editForm.allergies}
                                        onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                                        placeholder="e.g. Peanuts, Dust"
                                    />
                                </div>
                            </div>
                            <div className="ad-form-group">
                                <label>Medical Conditions</label>
                                <input
                                    className="ad-input"
                                    value={editForm.medical_conditions}
                                    onChange={e => setEditForm({ ...editForm, medical_conditions: e.target.value })}
                                    placeholder="e.g. Asthma, Diabetes"
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Medication</label>
                                <input
                                    className="ad-input"
                                    value={editForm.medications}
                                    onChange={e => setEditForm({ ...editForm, medications: e.target.value })}
                                    placeholder="e.g. Inhaler, Insulin"
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Health Notes</label>
                                <textarea
                                    className="ad-input"
                                    value={editForm.health_notes}
                                    onChange={e => setEditForm({ ...editForm, health_notes: e.target.value })}
                                    rows={3}
                                    placeholder="Any recent health updates or concerns..."
                                />
                            </div>

                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setSelectedChild(null)}>Close</button>
                                <button type="submit" className="btn-primary">Update Info</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
