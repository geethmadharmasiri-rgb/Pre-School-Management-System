import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

const AdminAttendance = () => {
    const { selectedYearId } = useOutletContext();
    const [filterDate, setFilterDate] = useState("");
    const [filterClass, setFilterClass] = useState("All");

    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/attendance?yearId=${selectedYearId}&date=${filterDate}&classId=${filterClass}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAttendance(data);
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (selectedYearId) {
            fetchAttendance();
        }
    }, [selectedYearId, filterDate, filterClass]);

    const filteredData = attendance;

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Attendance Records</h1>
                    <p className="ad-header-subtitle">View and monitor daily attendance</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="notification">{Icons.bell}</div>
                </div>
            </header>

            {/* FILTERS */}
            <div className="filters-section">
                <div className="ad-form-group" style={{ marginBottom: 0 }}>
                    <input
                        type="date"
                        className="ad-input"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>

                <select
                    className="ad-select"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Classes</option>
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Child Name</th>
                            <th>Class</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Teacher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(record => (
                            <tr key={record.id}>
                                <td style={{ fontWeight: 500 }}>{record.name}</td>
                                <td>{record.class}</td>
                                <td>{record.date}</td>
                                <td>
                                    <span className={`status-badge ${record.status === 'Present' ? 'active' : 'inactive'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td>{record.teacher}</td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No attendance records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAttendance;
