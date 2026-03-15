import React, { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

const AdminAcademicYears = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [yearName, setYearName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(false);

    const fetchYears = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/academic-years", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setYears(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleAddYear = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/academic-years", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    year_name: yearName, 
                    start_date: startDate,
                    end_date: endDate,
                    is_active: isActive 
                }),
            });
            if (res.ok) {
                setYearName("");
                setStartDate("");
                setEndDate("");
                setIsActive(false);
                setShowModal(false);
                fetchYears();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to add year");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleActivate = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/academic-years/${id}/activate`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchYears();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this academic year?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/academic-years/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchYears();
            } else {
                const err = await res.json();
                alert(err.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Academic Sessions</h1>
                    <p className="ad-header-subtitle">Manage school years and sessions</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    {Icons.plus} Add New Year
                </button>
            </header>

            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {years.map((year) => (
                    <div key={year.id} className="ad-card" style={{
                        border: year.is_active ? '2px solid var(--ad-accent)' : '1px solid #e2e8f0',
                        backgroundColor: year.is_active ? '#f0fdfa' : 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', margin: 0 }}>{year.year_name}</h3>
                                {year.is_active ? (
                                    <span className="status-badge active" style={{ marginTop: '8px', display: 'inline-block' }}>Current Active Session</span>
                                ) : (
                                    <span className="status-badge pending" style={{ marginTop: '8px', display: 'inline-block' }}>Past/Future Session</span>
                                )}
                            </div>
                            <div style={{ color: year.is_active ? 'var(--ad-accent)' : '#cbd5e1', fontSize: '24px' }}>
                                📅
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                            {!year.is_active && (
                                <button
                                    className="btn-primary"
                                    style={{ flex: 2, fontSize: '13px' }}
                                    onClick={() => handleActivate(year.id)}
                                >
                                    Set as Active
                                </button>
                            )}
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, color: '#ef4444', borderColor: '#fecaca', fontSize: '13px' }}
                                onClick={() => handleDelete(year.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {years.length === 0 && !loading && (
                    <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
                        No academic sessions found. Click the button above to add the first one.
                    </div>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Add Academic Year</h2>
                        <form onSubmit={handleAddYear}>
                            <div className="ad-form-group">
                                <label>Year Range / Name</label>
                                <input
                                    className="ad-input"
                                    placeholder="e.g. 2024/2025"
                                    value={yearName}
                                    onChange={(e) => setYearName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="ad-form-row">
                                <div className="ad-form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="ad-input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="ad-form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="ad-input"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="ad-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="active" style={{ marginBottom: 0 }}>Set as current active year</label>
                            </div>

                            <div className="ad-form-actions" style={{ marginTop: '30px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAcademicYears;
