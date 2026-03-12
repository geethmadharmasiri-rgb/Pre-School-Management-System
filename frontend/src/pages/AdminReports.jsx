import React from "react";
import { Icons } from "../components/Icons";

const AdminReports = () => {
    const [years, setYears] = React.useState([]);
    const [selectedYear, setSelectedYear] = React.useState("");

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

    const reportTypes = [
        { id: 1, title: "All Classes Summary", desc: "Overview of child counts and attendance for the selected session." },
        { id: 2, title: "Monthly Class Report", desc: "Detailed monthly breakdown including attendance and payments for this session." },
        { id: 3, title: "Child History Report", desc: "Complete history of a specific child across all academic sessions." },
        { id: 4, title: "Financial / Payment Report", desc: "Summary of received payments and pending dues for the selected year." },
    ];

    const handleExport = (type, format) => {
        alert(`Exporting ${type} for session ${years.find(y => y.id == selectedYear)?.year_name} as ${format}...`);
        // Mock download logic
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Reports Center</h1>
                    <p className="ad-header-subtitle">Generate and export system reports</p>
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

            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {reportTypes.map((report) => (
                    <div key={report.id} className="ad-card">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div className="icon big" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                {Icons.reports}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', color: 'var(--ad-text-primary)' }}>{report.title}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--ad-text-secondary)', fontWeight: 400, marginTop: '8px', lineHeight: '1.5' }}>
                                    {report.desc}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', width: '100%' }}>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                                onClick={() => handleExport(report.title, 'PDF')}
                            >
                                Export PDF
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                                onClick={() => handleExport(report.title, 'Excel')}
                            >
                                Export Excel
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminReports;
