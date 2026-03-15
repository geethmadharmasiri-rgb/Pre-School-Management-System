import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
    const [years, setYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState("");

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/admin/academic-years", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setYears(data);
                const current = data.find(y => y.is_active) || data[0];
                if (current) setSelectedYearId(current.id);
            } catch (err) {
                console.error("Failed to fetch years in AdminLayout:", err);
            }
        };
        fetchYears();
    }, []);

    return (
        <div className="ad-container">
            <AdminSidebar />
            <main className="ad-main">
                {/* Global Academic Year Selector */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
                    padding: '12px 24px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px'
                }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Academic Year:</span>
                    <select
                        className="ad-select"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}
                        value={selectedYearId}
                        onChange={(e) => setSelectedYearId(e.target.value)}
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>
                                {y.year_name} {y.is_active ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <Outlet context={{ selectedYearId }} />
            </main>
        </div>
    );
};

export default AdminLayout;
