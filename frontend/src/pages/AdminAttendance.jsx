import React, { useState } from "react";
import { Icons } from "../components/Icons";

const AdminAttendance = () => {
    const [years, setYears] = React.useState([]);
    const [selectedYear, setSelectedYear] = React.useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterClass, setFilterClass] = useState("All");

    React.useEffect(() => {
        const fetchYears = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/admin/academic-years", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setYears(data);
                const current = data.find(y => y.is_active) || data[0];
                if (current) setSelectedYear(current.id);
            } catch (err) { console.error(err); }
        };
        fetchYears();
    }, []);

    // Mock Data
    const attendanceData = [
        { id: 1, name: "Shanaya Perera", class: "Class A", date: "2024-01-20", status: "Present", teacher: "Ms. Clara Perera", deleted: false },
        { id: 2, name: "Nethmi Silva", class: "Class B", date: "2024-01-20", status: "Absent", teacher: "Mr. Erasha", deleted: false },
        { id: 3, name: "Shanaya Perera", class: "Class A", date: "2024-01-19", status: "Present", teacher: "Ms. Clara Perera", deleted: false },
        { id: 4, name: "Nethmi Silva", class: "Class B", date: "2024-01-19", status: "Present", teacher: "Mr. Erasha", deleted: true },
        { id: 5, name: "Amal Perera", class: "Class C", date: "2024-01-20", status: "Present", teacher: "Ms. Clara Perera", deleted: false },
    ];

    const filteredData = attendanceData.filter(record => {
        const matchClass = filterClass === "All" || record.class === filterClass;
        const matchDate = !filterDate || record.date === filterDate;
        const matchDeleted = !record.deleted;
        return matchClass && matchDate && matchDeleted;
    });

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Attendance Records</h1>
                    <p className="ad-header-subtitle">View and monitor daily attendance</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select
                        className="ad-select"
                        style={{ width: 'auto', fontWeight: 600 }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Current)' : ''}</option>
                        ))}
                    </select>
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
