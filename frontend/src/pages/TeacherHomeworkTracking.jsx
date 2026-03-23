import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TeacherHomeworkTracking = () => {
    const { homeworkId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ students: [], title: "" });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [reviewing, setReviewing] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [marks, setMarks] = useState("");

    useEffect(() => {
        fetchTrackingData();
    }, [homeworkId]);

    const fetchTrackingData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/homework/tracking/${homeworkId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (err) {
            console.error("Error fetching tracking:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/homework/review/${reviewing.submission_id}`, {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ feedback, marks })
            });

            if (response.ok) {
                alert("Review submitted successfully!");
                setReviewing(null);
                fetchTrackingData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredStudents = data.students.filter(s => {
        const status = s.status || "Pending";
        if (filter === "All") return true;
        return status === filter;
    });

    const stats = {
        total: data.students.length,
        submitted: data.students.filter(s => s.status && s.status !== "Pending").length,
        pending: data.students.filter(s => !s.status || s.status === "Pending").length,
        late: data.students.filter(s => s.status === "Late").length,
        reviewed: data.students.filter(s => s.status === "Reviewed").length
    };

    const completionRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading tracking data...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <header className="ad-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '8px 12px' }}>←</button>
                    <div>
                        <h1>Homework Tracking</h1>
                        <p className="ad-header-subtitle">Status for: <strong>{data.title}</strong></p>
                    </div>
                </div>
            </header>

            {/* Progress Overview */}
            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="ad-card" style={{ padding: '20px', minHeight: '130px', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 10px 0' }}>Overall Completion</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                        <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '6px' }}></div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '22px', color: '#10b981' }}>{completionRate}%</span>
                    </div>
                </div>
                <div className="ad-card" style={{ padding: '20px', textAlign: 'center', alignItems: 'center', minHeight: '130px', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 10px 0' }}>Total Students</p>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
                </div>
                <div className="ad-card" style={{ padding: '20px', textAlign: 'center', alignItems: 'center', minHeight: '130px', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 10px 0' }}>Submitted</p>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#0ea5e9' }}>{stats.submitted}</div>
                </div>
                <div className="ad-card" style={{ padding: '20px', textAlign: 'center', alignItems: 'center', minHeight: '130px', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 10px 0' }}>Pending</p>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {["All", "Pending", "Submitted", "Late", "Reviewed"].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={filter === f ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                        {f} {f !== "All" && `(${stats[f.toLowerCase()] || 0})`}
                    </button>
                ))}
            </div>

            {/* Students Table */}
            <div className="ad-card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '16px' }}>Student Name</th>
                            <th style={{ padding: '16px' }}>Status</th>
                            <th style={{ padding: '16px' }}>Submitted Time</th>
                            <th style={{ padding: '16px' }}>Marks</th>
                            <th style={{ padding: '16px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No students found for this filter.</td>
                            </tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{student.first_name} {student.last_name}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: (student.status === 'Reviewed' ? '#dcfce7' : student.status === 'Late' ? '#fee2e2' : student.status === 'Submitted' ? '#e0f2fe' : '#f1f5f9'),
                                            color: (student.status === 'Reviewed' ? '#166534' : student.status === 'Late' ? '#991b1b' : student.status === 'Submitted' ? '#075985' : '#475569')
                                        }}>
                                            {student.status || "Pending"}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                                        {student.submitted_at ? new Date(student.submitted_at).toLocaleString() : "-"}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{student.marks || "-"}</td>
                                    <td style={{ padding: '16px' }}>
                                        {student.submission_id ? (
                                            <button 
                                                className="btn-primary btn-small"
                                                onClick={() => {
                                                    setReviewing(student);
                                                    setFeedback(student.feedback || "");
                                                    setMarks(student.marks || "");
                                                }}
                                                style={{ width: '120px', justifyContent: 'center' }}
                                            >
                                                Grade & Review
                                            </button>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>No submission yet</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {reviewing && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="ad-card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', alignItems: 'stretch' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Review Submission</h2>
                            <button onClick={() => setReviewing(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        
                        <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
                            <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                                Student: <strong style={{ color: '#0f172a' }}>{reviewing.first_name} {reviewing.last_name}</strong>
                            </p>
                            {reviewing.submission_text && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '8px' }}>TEXT ANSWER:</label>
                                    <div style={{ padding: '15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {reviewing.submission_text}
                                    </div>
                                </div>
                            )}
                            {reviewing.file_path && (
                                <div>
                                    <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '8px' }}>ATTACHMENT:</label>
                                    <a href={`http://localhost:5000/${reviewing.file_path}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '10px 20px', fontSize: '14px' }}>
                                        📎 View Submitted File
                                    </a>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleReview} style={{ width: '100%' }}>
                            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginTop: '20px', width: '100%' }}>
                                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#0f172a' }}>Teacher Grading & Remarks</h3>
                                
                                <div className="ad-form-group" style={{ width: '100%' }}>
                                    <label style={{ fontWeight: 600, display: 'block' }}>Assign Marks / Grade</label>
                                    <input 
                                        type="text" 
                                        className="ad-input" 
                                        value={marks} 
                                        onChange={e => setMarks(e.target.value)}
                                        placeholder="e.g. 85/100, Grade A, Excellent, etc."
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                                
                                <div className="ad-form-group" style={{ width: '100%' }}>
                                    <label style={{ fontWeight: 600, display: 'block' }}>Feedback Comment</label>
                                    <textarea 
                                        className="ad-input" 
                                        rows="4" 
                                        value={feedback} 
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="Enter detailed feedback for student/parent..."
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="ad-form-actions" style={{ marginTop: '30px', justifyContent: 'center', width: '100%', gap: '15px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setReviewing(null)} style={{ padding: '12px 30px' }}>Close</button>
                                <button type="submit" className="btn-primary" style={{ padding: '12px 30px', minWidth: '200px', justifyContent: 'center' }}>Submit Grade & Feedback</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHomeworkTracking;
