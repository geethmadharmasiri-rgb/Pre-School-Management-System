import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function ChildProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [showHealthModal, setShowHealthModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [healthForm, setHealthForm] = useState({ allergies: "", medications: "", health_notes: "", blood_type: "", medical_conditions: "" });

    // Edit Profile State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ first_name: "", last_name: "", profilePic: null });
    const [selectedFile, setSelectedFile] = useState(null);

    // Mock Data for the Child
    const [childData, setChildData] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchChild = async () => {
            if (id === "999") {
                // UI Demo Mock Data
                setChildData({
                    id: 999,
                    first_name: "Tiana",
                    last_name: "Senanayake",
                    className: "Class A",
                    teacherName: "Ms. Sarah",
                    gender: "Female",
                    medical_conditions: "None",
                    allergies: "None",
                    medications: "None",
                    health_notes: "Healthy",
                    dob: "2021-05-15"
                });
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/children/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data && data.first_name) {
                    setChildData(data);
                } else {
                    setChildData(null);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChild();
    }, [id]);

    const handleEditOpen = () => {
        setEditData({
            first_name: childData.first_name,
            last_name: childData.last_name,
            profilePic: childData.profile_picture ? `http://localhost:5000/${childData.profile_picture}` : null
        });
        setSelectedFile(null);
        setShowEditModal(true);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("first_name", editData.first_name);
            formData.append("last_name", editData.last_name);
            if (selectedFile) {
                formData.append("profilePicture", selectedFile);
            }

            const res = await fetch(`http://localhost:5000/api/children/${id}/profile`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                // Refresh child data
                const updatedRes = await fetch(`http://localhost:5000/api/children/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const updatedData = await updatedRes.json();
                setChildData(updatedData);
                setShowEditModal(false);
            } else {
                alert("Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating profile");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setEditData({ ...editData, profilePic: url });
        }
    };

    const openHealthModal = () => {
        setHealthForm({
            allergies: childData.allergies || "",
            medications: childData.medications || "",
            health_notes: childData.health_notes || "",
            blood_type: childData.blood_type || "",
            medical_conditions: childData.medical_conditions || ""
        });
        setShowHealthModal(true);
    };

    const handleHealthSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/children/${id}/health-info`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(healthForm)
            });
            if (res.ok) {
                alert("Health info updated successfully");
                setShowHealthModal(false);
                window.location.reload();
            } else {
                const errData = await res.json();
                alert(`Update failed: ${errData.message || ''} ${errData.detail || ''}`);
            }
        } catch (err) { console.error(err); }
    };


    const tabs = [
        { id: "overview", label: "Overview", icon: Icons.dashboard },
        { id: "attendance", label: "Attendance", icon: Icons.attendance },
        { id: "health", label: "Health", icon: Icons.child },
        { id: "behavior", label: "Behavior", icon: Icons.reports },
        { id: "homework", label: "Homework", icon: Icons.reports },
        { id: "meal", label: "Meal Plan", icon: Icons.events },
        { id: "payments", label: "Payments", icon: Icons.payment },

    ];



    const renderTabs = () => (
        <div style={{ display: 'flex', gap: '10px', marginTop: '30px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '30px',
                        border: activeTab === tab.id ? '2px solid var(--ad-accent)' : '1px solid #e2e8f0',
                        backgroundColor: activeTab === tab.id ? 'var(--ad-accent)' : 'white',
                        color: activeTab === tab.id ? 'white' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === tab.id ? '0 8px 16px -4px rgba(16, 185, 129, 0.25)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: activeTab === tab.id ? 'scale(1.02)' : 'scale(1)'
                    }}
                >
                    <div style={{ width: '18px', height: '18px' }} className="icon">{tab.icon}</div>
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const [weekPlan, setWeekPlan] = useState({
        Monday: { lunch: "Not Set", snack: "Not Set", icon: "🍛" },
        Tuesday: { lunch: "Not Set", snack: "Not Set", icon: "🍝" },
        Wednesday: { lunch: "Not Set", snack: "Not Set", icon: "🍳" },
        Thursday: { lunch: "Not Set", snack: "Not Set", icon: "🥪" },
        Friday: { lunch: "Not Set", snack: "Not Set", icon: "🍲" },
        Saturday: { lunch: "No School", snack: "No School", icon: "🏠" },
        Sunday: { lunch: "No School", snack: "No School", icon: "🏠" }
    });

    const [behaviorReports, setBehaviorReports] = useState([]);
    const [homework, setHomework] = useState([]);

    React.useEffect(() => {
        const fetchMealPlans = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/meal-plans");
                const data = await res.json();
                if (data && data.length > 0) {
                    const newPlan = { ...weekPlan };
                    data.forEach(item => {
                        if (newPlan[item.day_of_week]) {
                            if (item.meal_type === 'Lunch') newPlan[item.day_of_week].lunch = item.menu;
                            if (item.meal_type === 'Snack') newPlan[item.day_of_week].snack = item.menu;
                        }
                    });
                    setWeekPlan(newPlan);
                }
            } catch (err) { console.error(err); }
        };

        const fetchBehaviorReports = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/behavior-reports?childId=${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setBehaviorReports(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        };

        const fetchHomework = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/children/${id}/homework`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                });
                const data = await res.json();
                setHomework(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        };

        fetchMealPlans();
        if (id) {
            fetchBehaviorReports();
            fetchHomework();
        }
    }, [id]);

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                            <h3 style={{ marginBottom: '15px' }}>Attendance Progress</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '8px solid #e0f2fe', borderTopColor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                                    85%
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 500 }}>Overall Presence</p>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Last present: Today</span>
                                </div>
                            </div>
                        </div>
                        <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                            <h3 style={{ marginBottom: '15px' }}>Quick Status</h3>
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>Payment</span>
                                    <span className="status-badge active">Paid</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>Health Alert</span>
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{childData.medical_conditions || "None"}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                                    <span>Latest Note</span>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Healthy and active...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "attendance":
                const history = [
                    { date: "2024-01-24", time: "08:15 AM", status: "Present", validated: "Ms. Clara Perera" },
                    { date: "2024-01-23", time: "08:22 AM", status: "Present", validated: "Ms. Clara Perera" },
                    { date: "2024-01-22", time: "08:10 AM", status: "Present", validated: "Ms. Clara Perera" },
                    { date: "2024-01-21", time: "---", status: "Absent", validated: "---" },
                    { date: "2024-01-20", time: "08:30 AM", status: "Present", validated: "Mr. Erasha" },
                ];
                return (
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>Monthly Attendance - January 2026</h3>
                            <button className="btn-secondary btn-small">Download Report</button>
                        </div>
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check-in Time</th>
                                    <th>Status</th>
                                    <th>Validated By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record, i) => (
                                    <tr key={i}>
                                        <td>{record.date}</td>
                                        <td style={{ fontWeight: 600, color: record.time === '---' ? '#94a3b8' : 'inherit' }}>{record.time}</td>
                                        <td>
                                            <span className={`status-badge ${record.status === 'Present' ? 'active' : 'inactive'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>{record.validated}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "health":
                return (
                    <div className="ad-form-card" style={{ maxWidth: '100%', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Health Profile</h3>
                            <button className="btn-primary btn-small" onClick={openHealthModal}>Update Health Info</button>
                        </div>

                        {childData.allergies && childData.allergies !== "None" && (
                            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', marginBottom: '20px' }}>
                                <h4 style={{ color: '#991b1b', margin: '0 0 5px 0' }}>Allergy Alert</h4>
                                <p style={{ color: '#ef4444', margin: 0 }}><strong>{childData.allergies}</strong></p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <h3>Medication & Conditions</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Medication:</p>
                                <p style={{ margin: '0 0 10px 0' }}>{childData.medications || "None"}</p>

                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Medical Conditions:</p>
                                <p style={{ margin: 0 }}>{childData.medical_conditions || "None"}</p>
                            </div>
                            <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <h3>Recent Health Notes (Concerns)</h3>
                                <p style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{childData.health_notes || "No recent notes reported."}</p>
                            </div>
                        </div>
                    </div>
                );
            case "behavior":
                const getRatingColor = (rating) => {
                    if (rating >= 4) return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
                    if (rating === 3) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
                    return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
                };

                const getRatingLabel = (rating) => {
                    if (rating === 5) return 'Excellent';
                    if (rating === 4) return 'Good';
                    if (rating === 3) return 'Average';
                    if (rating === 2) return 'Needs Improvement';
                    return 'Poor';
                };

                return (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>Behavior Reports</h3>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Total Reports: <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{behaviorReports.length}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {behaviorReports.map((row, i) => {
                                const colors = getRatingColor(row.rating);
                                return (
                                    <div
                                        key={i}
                                        className="ad-card"
                                        style={{
                                            textAlign: 'left',
                                            alignItems: 'flex-start',
                                            borderLeft: `4px solid ${colors.border}`,
                                            backgroundColor: '#fff',
                                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px', alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                                    {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <span style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0369a1',
                                                    fontWeight: 600
                                                }}>
                                                    {row.category}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>by {row.teacherName}</span>
                                        </div>

                                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                            {row.note}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Rating:</span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        style={{
                                                            fontSize: '20px',
                                                            color: star <= row.rating ? '#fbbf24' : '#e5e7eb',
                                                            textShadow: star <= row.rating ? '0 2px 4px rgba(251, 191, 36, 0.3)' : 'none'
                                                        }}
                                                    >
                                                        ⭐
                                                    </span>
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginLeft: '8px' }}>
                                                {getRatingLabel(row.rating)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {behaviorReports.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                    <p>No behavior reports found for this child.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case "homework":
                return (
                    <div className="table-container">
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject</th>
                                    <th>Activity</th>
                                    <th>Teacher</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homework.map((hw, i) => (
                                    <tr key={i}>
                                        <td>{new Date(hw.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                        <td style={{ fontWeight: 600 }}>{hw.title}</td>
                                        <td>{hw.description}</td>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>{hw.teacherName || 'Assigned'}</td>
                                        <td>
                                            {hw.file_path ? (
                                                <a
                                                    href={`http://localhost:5000/${hw.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-primary btn-small"
                                                    style={{ textDecoration: 'none', display: 'inline-block' }}
                                                >
                                                    View Material
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#94a3b8 italic' }}>No materials</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {homework.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            No homework assigned yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case "meal":
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

                return (
                    <div>
                        {/* TODAY'S SPECIAL HIGHLIGHT */}
                        <div className="ad-card" style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                            border: '1px solid #fcd34d',
                            marginBottom: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '48px' }}>🍽️</div>
                            <div>
                                <h3 style={{ color: '#92400e', marginBottom: '8px' }}>Today's Menu ({today})</h3>
                                {weekPlan[today] ? (
                                    <div>
                                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>{weekPlan[today].lunch}</p>
                                        <p style={{ color: '#b45309', fontWeight: 500, margin: 0 }}>+ {weekPlan[today].snack}</p>
                                    </div>
                                ) : (
                                    <p style={{ color: '#92400e', margin: 0 }}>No meal plan set for today (Weekend?).</p>
                                )}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '16px', color: 'var(--ad-text-secondary)', textAlign: 'left' }}>Weekly Schedule</h3>

                        <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            {Object.keys(weekPlan).map(day => (
                                <div key={day} className="ad-card" style={{
                                    borderTop: day === today ? '4px solid #10b981' : '4px solid transparent',
                                    textAlign: 'left',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', width: '100%' }}>
                                        <span style={{
                                            fontWeight: 700,
                                            color: day === today ? '#10b981' : '#64748b',
                                            textTransform: 'uppercase',
                                            fontSize: '13px',
                                            letterSpacing: '1px'
                                        }}>{day}</span>
                                        <span style={{ fontSize: '24px' }}>{weekPlan[day].icon}</span>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>LUNCH</label>
                                        <p style={{ fontWeight: 600, color: '#334155', marginTop: '4px', marginBottom: 0 }}>{weekPlan[day].lunch}</p>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SNACK</label>
                                        <p style={{ color: '#334155', marginTop: '4px', marginBottom: 0 }}>{weekPlan[day].snack}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "payments":
                return (
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>Payment History</h3>
                            <button className="btn-primary" onClick={() => navigate("/parent/upload-receipt", { state: { child: childData } })}>Upload Receipt</button>
                        </div>
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>January 2026</td>
                                    <td>Rs. 15,000</td>
                                    <td>10 Jan 2026</td>
                                    <td><span className="status-badge pending">Due</span></td>
                                    <td><button className="btn-primary btn-small" onClick={() => navigate("/parent/upload-receipt", { state: { child: childData } })}>Upload Receipt</button></td>
                                </tr>
                                <tr>
                                    <td>December 2025</td>
                                    <td>Rs. 15,000</td>
                                    <td>10 Dec 2025</td>
                                    <td><span className="status-badge active">Paid</span></td>
                                    <td><button className="action-btn view">Invoice</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!childData) return <div>Child not found</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <header className="ad-header" style={{ marginBottom: '20px' }}>
                <div>
                    <button
                        onClick={() => navigate('/parent')}
                        style={{ background: 'none', border: 'none', color: 'var(--ad-accent)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}
                    >
                        ← Back to Dashboard
                    </button>
                    <h1>Child Digital Folder</h1>
                    <p className="ad-header-subtitle">Comprehensive profile and records for {childData.first_name}</p>

                </div>
            </header>

            {/* HEADER */}
            <div className="ad-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '30px', padding: '30px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: 'none' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--ad-shadow)', overflow: 'hidden', border: '4px solid white'
                    }}>
                        {childData.profile_picture ? (
                            <img src={`http://localhost:5000/${childData.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '60px' }}>{childData.gender === 'Female' ? '👧' : '👦'}</span>
                        )}
                    </div>
                    <button
                        onClick={handleEditOpen}
                        style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', border: '1px solid #e2e8f0', width: '32px', height: '32px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                        title="Upload Photo"
                    >
                        📷
                    </button>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{childData.first_name} {childData.last_name}</h1>
                        <span className="status-badge active">Active</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Child ID</span>
                            <p style={{ margin: '4px 0', fontWeight: 600 }}>ILA-CH-{childData.id}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Class</span>
                            <p style={{ margin: '4px 0', fontWeight: 600 }}>{childData.className || "Unassigned"}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Teacher</span>
                            <p style={{ margin: '4px 0', fontWeight: 600 }}>{childData.teacherName || "Not Assigned"}</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" style={{ backgroundColor: '#0ea5e9' }} onClick={() => setShowQRModal(true)}>{Icons.plus} View QR</button>
                    <button className="btn-secondary" onClick={handleEditOpen}>Edit Profile</button>
                </div>
            </div>
            {renderTabs()}

            <div style={{ minHeight: '400px' }}>
                {renderContent()}
            </div>

            {/* HEALTH EDIT MODAL */}
            {showHealthModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Update Health Info</h2>
                        <form onSubmit={handleHealthSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="ad-form-group">
                                    <label>Blood Type</label>
                                    <select
                                        className="ad-input"
                                        value={healthForm.blood_type}
                                        onChange={e => setHealthForm({ ...healthForm, blood_type: e.target.value })}
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
                                        value={healthForm.allergies}
                                        onChange={e => setHealthForm({ ...healthForm, allergies: e.target.value })}
                                        placeholder="e.g. Peanuts, Dairy"
                                    />
                                </div>
                            </div>
                            <div className="ad-form-group">
                                <label>Medical Conditions</label>
                                <input
                                    className="ad-input"
                                    value={healthForm.medical_conditions}
                                    onChange={e => setHealthForm({ ...healthForm, medical_conditions: e.target.value })}
                                    placeholder="e.g. Asthma, Diabetes"
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Medication</label>
                                <input
                                    className="ad-input"
                                    value={healthForm.medications}
                                    onChange={e => setHealthForm({ ...healthForm, medications: e.target.value })}
                                    placeholder="e.g. Inhaler"
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Health Notes</label>
                                <textarea
                                    className="ad-input"
                                    rows={3}
                                    value={healthForm.health_notes}
                                    onChange={e => setHealthForm({ ...healthForm, health_notes: e.target.value })}
                                    placeholder="Share any concerns or updates..."
                                />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowHealthModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Edit Child Profile</h2>
                        <form onSubmit={handleEditSave}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9',
                                    margin: '0 auto 10px auto', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px dashed #cbd5e1', position: 'relative'
                                }}>
                                    {editData.profilePic ? (
                                        <img src={editData.profilePic} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '40px' }}>📷</span>
                                    )}
                                </div>
                                <label className="btn-secondary btn-small" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                    Change Photo
                                    <input type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>

                            <div className="ad-form-group">
                                <label>First Name</label>
                                <input className="ad-input" value={editData.first_name} onChange={e => setEditData({ ...editData, first_name: e.target.value })} required />
                            </div>
                            <div className="ad-form-group">
                                <label>Last Name</label>
                                <input className="ad-input" value={editData.last_name} onChange={e => setEditData({ ...editData, last_name: e.target.value })} required />
                            </div>

                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showQRModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '350px', textAlign: 'center', padding: '40px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Digital ID</h2>
                        <div style={{
                            padding: '20px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            display: 'inline-block',
                            border: '1px solid #e2e8f0',
                            boxShadow: 'var(--ad-shadow)'
                        }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ILA-CH-${childData.id}`}
                                alt="QR Code"
                                style={{ width: '180px', height: '180px' }}
                            />
                        </div>
                        <p style={{ marginTop: '20px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>
                            ILA-CH-{String(childData.id).padStart(3, '0')}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '10px 0 30px 0' }}>
                            Scan this code daily at the entrance for attendance verification.
                        </p>
                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowQRModal(false)}>Close</button>
                    </div>
                </div>
            )}

            <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                ILA Kids Campus • Professional Child Management System
            </footer>
        </div>
    );
}
