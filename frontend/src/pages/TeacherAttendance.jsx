import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherAttendance() {
    const { selectedYearId } = useOutletContext();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (selectedYearId) fetchClassChildren();
    }, [selectedYearId]);

    const fetchClassChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/children?yearId=${selectedYearId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            // Initialize children with QR statuses
            const initializedData = data.map(c => ({
                ...c,
                qrStatus: "Pending", // Pending, Scanned, Validated, Absent
                scanTime: null
            }));
            setChildren(initializedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = (id) => {
        setChildren(prev => prev.map(c =>
            c.id === id ? { ...c, qrStatus: "Validated" } : c
        ));
    };

    const handleMarkManual = (id, status) => {
        setChildren(prev => prev.map(c =>
            c.id === id ? { ...c, qrStatus: status, scanTime: status === "Validated" ? "Manual" : null } : c
        ));
    };

    const simulateQRScan = () => {
        const pending = children.filter(c => c.qrStatus === "Pending");
        if (pending.length === 0) return alert("All children have been processed!");

        const randomIndex = Math.floor(Math.random() * pending.length);
        const targetChild = pending[randomIndex];
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setChildren(prev => prev.map(c =>
            c.id === targetChild.id ? { ...c, qrStatus: "Scanned", scanTime: now } : c
        ));
    };

    const stats = {
        total: children.length,
        scanned: children.filter(c => c.qrStatus === "Scanned").length,
        validated: children.filter(c => c.qrStatus === "Validated").length,
        absent: children.filter(c => c.qrStatus === "Absent").length
    };

    const filteredChildren = children.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Child Attendance</h1>
                    <p className="ad-header-subtitle">Validate scanned QR codes and mark attendance</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={simulateQRScan}>Simulate QR Scan</button>
                    <div className="notification">{Icons.bell}</div>
                </div>
            </header>

            {/* STATS OVERVIEW */}
            <div className="ad-cards" style={{ marginBottom: '24px' }}>
                <div className="ad-card" style={{ padding: '15px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>TOTAL CHILDREN</span>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
                </div>
                <div className="ad-card" style={{ padding: '15px', borderLeft: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>AWAITING VALIDATION</span>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.scanned}</div>
                </div>
                <div className="ad-card" style={{ padding: '15px', borderLeft: '4px solid #16a34a' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>VALIDATED PRESENT</span>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{stats.validated}</div>
                </div>
                <div className="ad-card" style={{ padding: '15px', borderLeft: '4px solid #ef4444' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>MARKED ABSENT</span>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.absent}</div>
                </div>
            </div>

            <div className="table-container">
                <div className="filters-section">
                    <input
                        type="text"
                        placeholder="Search child..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <input
                        type="date"
                        className="ad-input"
                        style={{ width: 'auto' }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <button className="btn-primary" onClick={() => {
                        setChildren(prev => prev.map(c => ({ ...c, qrStatus: "Validated" })));
                    }}>Mark All Validated</button>
                    <button className="btn-primary" style={{ backgroundColor: '#16a34a' }} onClick={async () => {
                        try {
                            const token = localStorage.getItem("token");
                            const attendanceData = children.map(c => ({
                                child_id: c.id,
                                status: c.qrStatus === "Pending" ? "Absent" : c.qrStatus,
                                check_in_time: c.scanTime
                            }));
                            const res = await fetch("http://localhost:5000/api/attendance", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ date, attendanceData })
                            });
                            if (res.ok) alert("Attendance saved to database!");
                            else alert("Failed to save attendance");
                        } catch (err) {
                            console.error(err);
                            alert("Error saving attendance");
                        }
                    }}>Save Attendance</button>
                </div>


                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Child Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredChildren.map((child) => (
                            <tr key={child.id}>
                                <td>ILA-CH-{String(child.id).padStart(3, '0')}</td>
                                <td>{child.first_name} {child.last_name}</td>
                                <td>
                                    {child.qrStatus === "Pending" && <span className="status-badge pending">Pending Scan</span>}
                                    {child.qrStatus === "Scanned" && (
                                        <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                                            Scanned ({child.scanTime})
                                        </span>
                                    )}
                                    {child.qrStatus === "Validated" && <span className="status-badge active">Validated Present</span>}
                                    {child.qrStatus === "Absent" && <span className="status-badge inactive">Absent</span>}
                                </td>
                                <td>
                                    {child.qrStatus === "Scanned" && (
                                        <button
                                            className="action-btn approve"
                                            style={{ width: 'auto', padding: '6px 15px' }}
                                            onClick={() => handleValidate(child.id)}
                                        >
                                            Validate Check-in
                                        </button>
                                    )}
                                    {(child.qrStatus === "Pending" || child.qrStatus === "Absent") && (
                                        <button className="action-btn approve" onClick={() => handleMarkManual(child.id, "Validated")}>Present</button>
                                    )}
                                    {child.qrStatus !== "Absent" && child.qrStatus !== "Validated" && (
                                        <button className="action-btn delete" onClick={() => handleMarkManual(child.id, "Absent")}>Absent</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredChildren.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No children found</td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
