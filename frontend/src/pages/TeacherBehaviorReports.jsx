import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherBehaviorReports() {
    const { selectedYearId } = useOutletContext();
    const [children, setChildren] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedChild, setSelectedChild] = useState("");
    const [observation, setObservation] = useState("");
    const [rating, setRating] = useState(3);
    const [category, setCategory] = useState("General");
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (selectedYearId) {
            fetchClassChildren();
            fetchReports();
        }
    }, [selectedYearId]);

    const fetchClassChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/children?yearId=${selectedYearId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setChildren(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/behavior-reports?yearId=${selectedYearId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        "General",
        "Social Skills",
        "Sharing & Cooperation",
        "Self-Regulation",
        "Communication",
        "Following Directions",
        "Emotional Control",
        "Independence"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedChild || !observation) {
            alert("Please select a child and enter an observation.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const url = editingId ? `http://localhost:5000/api/behavior-reports/${editingId}` : "http://localhost:5000/api/behavior-reports";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    child_id: selectedChild,
                    rating,
                    category,
                    note: observation,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (res.ok) {
                alert(editingId ? "Behavior report updated successfully!" : "Behavior report submitted successfully!");
                // Reset form
                setSelectedChild("");
                setObservation("");
                setRating(3);
                setCategory("General");
                setEditingId(null);
                // Refresh list
                fetchReports();
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit report");
        }
    };

    const handleEdit = (report) => {
        setEditingId(report.id);
        setSelectedChild(report.child_id);
        setObservation(report.note);
        setRating(report.rating);
        setCategory(report.category);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/behavior-reports/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchReports();
            } else {
                alert("Failed to delete report");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting report");
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
        if (rating === 3) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    };

    const StarRating = ({ value, onChange, readOnly = false }) => {
        return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        onClick={() => !readOnly && onChange && onChange(star)}
                        style={{
                            fontSize: '28px',
                            cursor: readOnly ? 'default' : 'pointer',
                            color: star <= value ? '#fbbf24' : '#e5e7eb',
                            transition: 'all 0.2s',
                            textShadow: star <= value ? '0 2px 4px rgba(251, 191, 36, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => !readOnly && (e.target.style.transform = 'scale(1.2)')}
                        onMouseLeave={(e) => !readOnly && (e.target.style.transform = 'scale(1)')}
                    >
                        ⭐
                    </span>
                ))}
                <span style={{ marginLeft: '10px', fontWeight: 600, color: '#64748b' }}>
                    {value === 5 ? 'Excellent' : value === 4 ? 'Good' : value === 3 ? 'Average' : value === 2 ? 'Needs Improvement' : 'Poor'}
                </span>
            </div>
        );
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Behavior Reports</h1>
                    <p className="ad-header-subtitle">Track and report child behavioral progress</p>
                </div>
            </header>

            {/* CREATE NEW REPORT FORM */}
            <div className="ad-form-card" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>📝</span>
                    {editingId ? "Edit Behavior Report" : "Create New Behavior Report"}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Select Child *</label>
                            <select
                                className="ad-select"
                                value={selectedChild}
                                onChange={(e) => setSelectedChild(e.target.value)}
                                required
                                disabled={!!editingId}
                            >
                                <option value="">Choose a child...</option>
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ad-form-group">
                            <label>Behavior Category</label>
                            <select
                                className="ad-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="ad-form-group">
                        <label>Behavioral Rating *</label>
                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <StarRating value={rating} onChange={setRating} />
                            <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', marginBottom: 0 }}>
                                Rate the child's behavior today (1 = Needs attention, 5 = Excellent)
                            </p>
                        </div>
                    </div>

                    <div className="ad-form-group">
                        <label>Observation / Notes *</label>
                        <textarea
                            className="ad-textarea"
                            placeholder="Describe the behavioral observation, specific incidents, or progress made..."
                            rows={4}
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            required
                        />
                    </div>

                    <div className="ad-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => {
                            setSelectedChild("");
                            setObservation("");
                            setRating(3);
                            setCategory("General");
                            setEditingId(null);
                        }}>{editingId ? "Cancel Edit" : "Clear Form"}</button>
                        <button type="submit" className="btn-primary">{editingId ? "Update Report" : "Submit Report"}</button>
                    </div>
                </form>
            </div>

            {/* RECENT REPORTS */}
            <div className="ad-card">
                <h3 style={{ marginBottom: '20px' }}>Recent Behavior Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reports.map(report => {
                        const colors = getRatingColor(report.rating);
                        return (
                            <div
                                key={report.id}
                                className="ad-card"
                                style={{
                                    borderLeft: `4px solid ${colors.border}`,
                                    backgroundColor: '#fff',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                                            {report.first_name} {report.last_name}
                                        </h4>
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: '#e0f2fe',
                                            color: '#0369a1',
                                            fontWeight: 600
                                        }}>
                                            {report.category}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                            {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>by {report.teacherName}</div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                            <button 
                                                onClick={() => handleEdit(report)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', fontSize: '16px' }}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(report.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                    {report.note}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Rating:</span>
                                    <StarRating value={report.rating} readOnly />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {reports.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <p>No behavior reports yet. Create your first report above!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
