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
        Saturday: { lunch: "Not Set", snack: "Not Set", icon: "🏠" },
        Sunday: { lunch: "Not Set", snack: "Not Set", icon: "🏠" }
    });

    const [behaviorReports, setBehaviorReports] = useState([]);
    const [homework, setHomework] = useState([]);
    const [childPayment, setChildPayment] = useState(null);

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

        const fetchChildPayment = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/parent/payments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                // Find payment for this specific child
                const thisChildPay = data.find(p => p.child_id == id);
                setChildPayment(thisChildPay);
            } catch (err) { console.error(err); }
        };

        fetchMealPlans();
        if (id) {
            fetchBehaviorReports();
            fetchHomework();
            fetchChildPayment();
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
                                    <span style={{ 
                                        fontWeight: 700, 
                                        color: childPayment?.status === 'Paid' ? '#16a34a' : (childPayment?.status === 'Pending' ? '#b45309' : '#ef4444') 
                                    }}>
                                        {childPayment?.status === 'Paid' ? '✅ Paid' : (childPayment?.status === 'Pending' ? '⏳ Pending' : '⚠️ Due')}
                                    </span>
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
                                <h4 style={{ color: '#991b1b', margin: '0 0 5px 0' }}>⚠️ Allergy Alert</h4>
                                <p style={{ color: '#ef4444', margin: 0 }}><strong>{childData.allergies}</strong></p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <h3>Medication & Conditions</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Medication:</p>
                                <p style={{ margin: '0 0 10px 0' }}>{childData.medications || "None"}</p>

                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Medical Conditions:</p>
                                <p style={{ margin: 0 }}>{childData.medical_conditions || "None"}</p>
                            </div>
                            <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Blood Type</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '22px', color: '#0ea5e9' }}>{childData.blood_type || "—"}</p>
                            </div>
                        </div>

                        {/* DUAL NOTES — Parent & Teacher */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                            {/* Parent's own notes */}
                            <div style={{
                                border: '2px solid #bfdbfe', borderRadius: '12px',
                                padding: '16px', backgroundColor: '#eff6ff'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '20px' }}>👨‍👩‍👧</span>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1d4ed8' }}>Your Notes</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd' }}>Added by Parent</p>
                                    </div>
                                </div>
                                <p style={{
                                    margin: 0, fontSize: '14px', color: childData.health_notes ? '#334155' : '#94a3b8',
                                    whiteSpace: 'pre-wrap', lineHeight: '1.6',
                                    fontStyle: childData.health_notes ? 'normal' : 'italic'
                                }}>
                                    {childData.health_notes || "You haven't added any health notes yet."}
                                </p>
                            </div>

                            {/* Teacher's notes — READ ONLY for parent */}
                            <div style={{
                                border: '2px solid #bbf7d0', borderRadius: '12px',
                                padding: '16px', backgroundColor: '#f0fdf4'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '20px' }}>👩‍🏫</span>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#15803d' }}>Teacher's Notes</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#86efac' }}>Added by Teacher</p>
                                    </div>
                                </div>
                                <p style={{
                                    margin: 0, fontSize: '14px', color: childData.teacher_health_notes ? '#334155' : '#94a3b8',
                                    whiteSpace: 'pre-wrap', lineHeight: '1.6',
                                    fontStyle: childData.teacher_health_notes ? 'normal' : 'italic'
                                }}>
                                    {childData.teacher_health_notes || "No notes from teacher yet."}
                                </p>
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
                const dayColors = {
                    Monday:    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', light: '#f3f0ff', border: '#c4b5fd', icon: '🍛' },
                    Tuesday:   { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', light: '#fff0f5', border: '#fbb6ce', icon: '🍝' },
                    Wednesday: { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', light: '#f0fbff', border: '#93c5fd', icon: '🍳' },
                    Thursday:  { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', light: '#f0fff9', border: '#6ee7b7', icon: '🥪' },
                    Friday:    { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', light: '#fffbf0', border: '#fcd34d', icon: '🍲' },
                    Saturday:  { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', light: '#f9fafb', border: '#e2e8f0', icon: '🏠' },
                    Sunday:    { gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', light: '#f9fafb', border: '#e2e8f0', icon: '🏠' },
                };
                return (
                    <div>
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            marginBottom: '24px', textAlign: 'left' 
                        }}>
                            <span style={{ fontSize: '32px' }}>🍽️</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Weekly Meal Schedule</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Nutritional plan set by your child's teacher</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            {Object.keys(weekPlan).map(day => {
                                const colors = dayColors[day] || dayColors.Monday;
                                const hasLunch = weekPlan[day].lunch && weekPlan[day].lunch !== "Not Set";
                                const hasSnack = weekPlan[day].snack && weekPlan[day].snack !== "Not Set";
                                const hasMenu = hasLunch || hasSnack;
                                return (
                                    <div key={day} style={{
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: hasMenu
                                            ? '0 4px 20px rgba(0,0,0,0.10)'
                                            : '0 1px 4px rgba(0,0,0,0.06)',
                                        border: `1px solid ${colors.border}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        opacity: hasMenu ? 1 : 0.6
                                    }}>
                                        {/* Day Header */}
                                        <div style={{
                                            background: colors.gradient,
                                            padding: '14px 18px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontWeight: 800,
                                                color: 'white',
                                                fontSize: '14px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1.5px',
                                                textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}>{day}</span>
                                            <span style={{ fontSize: '26px' }}>{colors.icon}</span>
                                        </div>

                                        {/* Meal Content */}
                                        <div style={{ padding: '16px 18px', backgroundColor: colors.light }}>
                                            {/* Lunch */}
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '14px' }}>🍱</span>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 700, color: '#64748b',
                                                        textTransform: 'uppercase', letterSpacing: '1px'
                                                    }}>Lunch</span>
                                                </div>
                                                {hasLunch ? (
                                                    <div style={{
                                                        background: 'white',
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        border: `1px solid ${colors.border}`,
                                                        fontWeight: 600,
                                                        color: '#1e293b',
                                                        fontSize: '14px',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                        {weekPlan[day].lunch}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        background: 'white',
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        border: '1px dashed #e2e8f0',
                                                        color: '#cbd5e1',
                                                        fontSize: '13px',
                                                        fontStyle: 'italic'
                                                    }}>Not scheduled</div>
                                                )}
                                            </div>

                                            {/* Snack */}
                                            <div>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '14px' }}>🍎</span>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 700, color: '#64748b',
                                                        textTransform: 'uppercase', letterSpacing: '1px'
                                                    }}>Snack</span>
                                                </div>
                                                {hasSnack ? (
                                                    <div style={{
                                                        background: 'white',
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        border: `1px solid ${colors.border}`,
                                                        fontWeight: 600,
                                                        color: '#1e293b',
                                                        fontSize: '14px',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                        {weekPlan[day].snack}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        background: 'white',
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        border: '1px dashed #e2e8f0',
                                                        color: '#cbd5e1',
                                                        fontSize: '13px',
                                                        fontStyle: 'italic'
                                                    }}>Not scheduled</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case "payments":
                const getStatusBadge = (status) => {
                    if (!status) return <span className="status-badge pending" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>Due</span>;
                    switch (status) {
                        case "Paid": return <span className="status-badge verified" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>✅ Paid</span>;
                        case "Pending": return <span className="status-badge pending" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>⏳ Processing</span>;
                        case "Overdue": return <span className="status-badge failed" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>❌ Overdue</span>;
                        default: return <span className="status-badge">{status}</span>;
                    }
                };

                return (
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Monthly Payment Status</h3>
                            {childPayment?.status !== "Paid" && (
                                <button className="btn-primary" onClick={() => navigate("/parent/upload-receipt", { state: { child: childData } })}>Upload Receipt</button>
                            )}
                        </div>
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Amount</th>
                                    <th>Status Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                        Rs. {childPayment ? parseFloat(childPayment.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 }) : "5,000.00"}
                                    </td>
                                    <td style={{ color: '#64748b' }}>
                                        {childPayment?.payment_date ? new Date(childPayment.payment_date).toLocaleDateString() : "Pending"}
                                    </td>
                                    <td>{getStatusBadge(childPayment?.status)}</td>
                                    <td>
                                        {childPayment?.status === "Paid" ? (
                                            <span style={{ color: '#16a34a', fontWeight: 700 }}>VERIFIED</span>
                                        ) : (
                                            <button 
                                                className="btn-primary btn-small" 
                                                onClick={() => navigate("/parent/upload-receipt", { state: { child: childData } })}
                                            >
                                                {childPayment?.status === "Pending" ? "Update Receipt" : "Upload Receipt"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', fontSize: '13px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: 0 }}><strong>Note:</strong> Monthly fees are set globally by the administration. Any change in the school's fee structure will be reflected here automatically.</p>
                        </div>
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
