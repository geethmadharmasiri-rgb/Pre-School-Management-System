import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherAttendance() {
    const { selectedYearId } = useOutletContext();
    const [children, setChildren] = useState([]);
    const [className, setClassName] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState("daily");
    const [historyData, setHistoryData] = useState([]);

    useEffect(() => {
        if (selectedYearId) {
            if (activeTab === "daily") fetchAttendance();
            else fetchHistory();
        }
    }, [selectedYearId, date, activeTab]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/teacher/attendance?date=${date}&yearId=${selectedYearId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setChildren(data.children || []);
            setClassName(data.className || "");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/teacher/attendance/history-summary?yearId=${selectedYearId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setHistoryData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredChildren = children.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: children.length,
        present: children.filter(c => c.status === 'Present' && !c.check_out_time).length,
        completed: children.filter(c => c.check_out_time).length,
        absent: children.filter(c => c.status === 'Absent').length,
        notMarked: children.filter(c => !c.status).length,
    };

    const formatTime = (t) => {
        if (!t) return '--:--';
        const str = t.toString();
        return str.length >= 5 ? str.slice(0, 5) : str;
    };

    const parseDate = (dateVal) => {
        if (!dateVal) return new Date();
        if (typeof dateVal === 'string') {
            const [y, m, d] = dateVal.split('T')[0].split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        return new Date(dateVal);
    };

    return (
        <div className="attendance-page" style={{ color: '#1e293b' }}>
            {/* ── Header ── */}
            <header className="ad-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', fontWeight: 800 }}>{className || "Class"} Attendance</h1>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                            Read-only dashboard. Please use the mobile app for daily check-ins.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
                        <button
                            onClick={() => setActiveTab("daily")}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', 
                                backgroundColor: activeTab === 'daily' ? '#fff' : 'transparent', 
                                color: activeTab === 'daily' ? '#4f46e5' : '#64748b',
                                boxShadow: activeTab === 'daily' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' 
                            }}>
                            <span style={{ width: '16px' }}>{Icons.attendance}</span> Daily view
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', 
                                backgroundColor: activeTab === 'history' ? '#fff' : 'transparent', 
                                color: activeTab === 'history' ? '#4f46e5' : '#64748b',
                                boxShadow: activeTab === 'history' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' 
                            }}>
                            <span style={{ width: '16px' }}>{Icons.clock}</span> History
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === "daily" ? (
                <>
                    {/* ── Summary Cards ── */}
                    <div className="ad-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'TOTAL STUDENTS', value: stats.total, color: '#0f172a', border: '#e2e8f0', bg: '#f8fafc' },
                            { label: 'IN SCHOOL', value: stats.present, color: '#16a34a', border: '#10b981', bg: '#f0fdf4' },
                            { label: 'PICKED UP', value: stats.completed, color: '#4f46e5', border: '#6366f1', bg: '#eef2ff' },
                            { label: 'ABSENT', value: stats.absent, color: '#dc2626', border: '#ef4444', bg: '#fef2f2' },
                            { label: 'PENDING', value: stats.notMarked, color: '#d97706', border: '#f59e0b', bg: '#fffbeb' },
                        ].map(s => (
                            <div key={s.label} style={{ 
                                backgroundColor: s.bg, padding: '20px', borderRadius: '16px', 
                                borderLeft: `5px solid ${s.border}`, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>{s.label}</span>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: s.color, marginTop: '4px' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Search & Date ── */}
                    <div style={{ 
                        display: 'flex', gap: '12px', marginBottom: '16px', backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0',
                        alignItems: 'center'
                    }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: '12px', top: '10px', width: '18px', color: '#94a3b8' }}>{Icons.search}</span>
                            <input
                                type="text"
                                placeholder="Search child by name..."
                                style={{ 
                                    width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '2px solid #f1f5f9',
                                    fontSize: '14px', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 500
                                }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <input
                            type="date"
                            style={{ 
                                padding: '10px 14px', borderRadius: '10px', border: '2px solid #f1f5f9',
                                fontSize: '14px', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc'
                            }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <button
                            onClick={() => fetchAttendance()}
                            style={{ 
                                padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#4f46e5', color: '#fff',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.9'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                        >
                            Refresh
                        </button>
                    </div>

                    {/* ── Table ── */}
                    <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table className="ad-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>CHILD</th>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>STATUS</th>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>CHECK-IN</th>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>CHECK-OUT</th>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>METHOD / REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading class roster...</td></tr>
                                ) : filteredChildren.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No records found for this date.</td></tr>
                                ) : filteredChildren.map((child) => (
                                    <tr key={child.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{child.first_name} {child.last_name}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: CH-{child.id}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {!child.status ? (
                                                <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #ffedd5' }}>PENDING</span>
                                            ) : child.status === 'Present' && child.check_out_time ? (
                                                <span style={{ backgroundColor: '#eef2ff', color: '#4338ca', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #e0e7ff' }}>COMPLETED</span>
                                            ) : child.status === 'Present' ? (
                                                <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #dcfce7' }}>PRESENT</span>
                                            ) : (
                                                <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #fee2e2' }}>ABSENT</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: child.check_in_time ? '#0f172a' : '#cbd5e1' }}>
                                            {formatTime(child.check_in_time)}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: child.check_out_time ? '#4f46e5' : '#cbd5e1' }}>
                                            {formatTime(child.check_out_time)}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {child.method && (
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 800, padding: '3px 6px', borderRadius: '4px',
                                                        backgroundColor: child.method === 'QR' ? '#0ea5e9' : '#a855f7', color: '#fff',
                                                    }}>
                                                        {child.method}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>{child.remarks || ''}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* ── History Table ── */
                <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table className="ad-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>DATE</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>PRESENT</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>ABSENT</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>PICKED UP</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>PERCENTAGE / TREND</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading sessions...</td></tr>
                            ) : historyData.map((day, idx) => {
                                const total = (day.present_count || 0) + (day.absent_count || 0);
                                const rate = total > 0 ? Math.round((day.present_count / total) * 100) : 0;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b' }}>
                                            {parseDate(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '15px' }}>✅ {day.present_count ?? 0}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '15px' }}>❌ {day.absent_count ?? 0}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ color: '#6366f1', fontWeight: 800, fontSize: '15px' }}>🏠 {day.completed_count ?? 0}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '100px', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        width: `${rate}%`, height: '100%', 
                                                        backgroundColor: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' 
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
