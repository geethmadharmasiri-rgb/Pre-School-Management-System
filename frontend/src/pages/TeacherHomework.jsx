import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

export default function TeacherHomework() {
    const navigate = useNavigate();
    const { selectedYearId } = useOutletContext();
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedYearId) {
            fetchHomework();
        }
    }, [selectedYearId]);

    const fetchHomework = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/homework?yearId=${selectedYearId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHomework(data);
            }
        } catch (err) {
            console.error("Error fetching homework:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteHomework = async (id) => {
        try {
            console.log(`[DELETE] Starting deletion for ID: ${id}`);
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/homework/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[DELETE] Successfully deleted ID: ${id}`);
                setHomework(homework.filter(h => h.id !== id));
            } else {
                console.error(`[DELETE] Failed:`, data);
                const debugInfo = data.debugRole ? ` (Your role: ${data.debugRole})` : "";
                alert(`Failed to delete homework: ${data.message || 'Unknown error'}${debugInfo}`);
            }
        } catch (err) {
            console.error("[DELETE] Error:", err);
            alert("Server error during deletion. Please check connection.");
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Homework Management</h1>
                    <p className="ad-header-subtitle">Assign and track child homework</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/teacher/homework/new')}>Add New Homework</button>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading homework...</div>
            ) : (
                <div className="ad-cards">
                    {homework.length === 0 ? (
                        <div className="ad-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#64748b' }}>No homework assigned yet for this session.</p>
                        </div>
                    ) : (
                        homework.map((hw) => (
                            <div key={hw.id} className="ad-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3>{hw.title}</h3>
                                        <div className="ad-card-value" style={{ fontSize: '18px', marginBottom: '8px' }}>{hw.description}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => navigate(`/teacher/homework/edit/${hw.id}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to delete this homework?")) {
                                                    deleteHomework(hw.id);
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>
                                    <strong>Due:</strong> {new Date(hw.due_date).toLocaleDateString()}
                                </p>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>
                                    <strong>Class:</strong> {hw.className}
                                </p>
                                {hw.file_path && (
                                    <div style={{ marginTop: '12px' }}>
                                        <a
                                            href={`http://localhost:5000/${hw.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link-primary"
                                            style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            View Attached Material
                                        </a>
                                    </div>
                                )}
                                </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
