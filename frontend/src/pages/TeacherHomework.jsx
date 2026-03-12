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
                            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/teacher/homework/new')}>Create Your First Assignment</button>
                        </div>
                    ) : (
                        homework.map((hw) => (
                            <div key={hw.id} className="ad-card">
                                <h3>{hw.title}</h3>
                                <div className="ad-card-value" style={{ fontSize: '18px', marginBottom: '8px' }}>{hw.description}</div>
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
                                <div style={{ marginTop: '16px' }}>
                                    <button className="btn-primary btn-small">View Submissions</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
