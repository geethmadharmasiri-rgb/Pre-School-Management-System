import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const AdminReports = () => {
    const { selectedYearId } = useOutletContext();
    const [loading, setLoading] = useState(false);
    
    // Additional filters for specific reports
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [childSearch, setChildSearch] = useState("");
    const [childResults, setChildResults] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [showChildSearch, setShowChildSearch] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const reportTypes = [
        { id: 1, title: "All Classes Summary", desc: "Overview of child counts and attendance for the selected session.", type: 'summary' },
        { id: 2, title: "Monthly Class Report", desc: "Detailed monthly breakdown including attendance and payments for this session.", type: 'monthly' },
        { id: 3, title: "Child History Report", desc: "Complete history of a specific child across all academic sessions.", type: 'history' },
        { id: 4, title: "Financial / Payment Report", desc: "Summary of received payments and pending dues for the selected year.", type: 'financial' },
    ];

    const fetchChildSearch = async (query) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/reports/children-search?q=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setChildResults(data);
        } catch (err) {
            console.error("Search failed", err);
        }
    };

    const handleExport = async (report, format) => {
        if (!selectedYearId && report.type !== 'history') {
            alert("Please select an academic year first.");
            return;
        }

        if (report.type === 'history' && !selectedChild) {
            setShowChildSearch(true);
            return;
        }

        if (report.type === 'monthly' && !showMonthPicker) {
            setShowMonthPicker(true);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            let endpoint = "";
            let filename = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
            let data = [];

            if (report.type === 'summary') {
                endpoint = `http://localhost:5000/api/admin/reports/classes-summary?yearId=${selectedYearId}`;
            } else if (report.type === 'financial') {
                endpoint = `http://localhost:5000/api/admin/reports/financial?yearId=${selectedYearId}`;
            } else if (report.type === 'monthly') {
                endpoint = `http://localhost:5000/api/admin/reports/monthly-class?yearId=${selectedYearId}&month=${selectedMonth}`;
            } else if (report.type === 'history') {
                endpoint = `http://localhost:5000/api/admin/reports/child-history/${selectedChild.id}`;
            }

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            data = await res.json();

            if (report.type === 'history') {
                if (!data || !data.child) throw new Error(data.message || "Child history not found");
            } else if (!Array.isArray(data)) {
                throw new Error(data.message || "Invalid data received from server");
            }

            if (format === 'PDF') {
                exportToPDF(report, data, filename);
            } else {
                exportToExcel(report, data, filename);
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = (report, data, filename) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("ILA KIDS CAMPUS", 105, 15, { align: "center" });
        doc.setFontSize(14);
        doc.text(report.title, 105, 25, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

        if (report.type === 'summary') {
            const tableData = data.map(item => [item.name, item.teacherName || 'N/A', item.studentCount, item.capacity]);
            autoTable(doc, {
                startY: 40,
                head: [['Class Name', 'Teacher', 'Students', 'Capacity']],
                body: tableData,
            });
        } else if (report.type === 'financial') {
            const tableData = data.map(item => [
                item.receipt_number || 'N/A',
                new Date(item.payment_date).toLocaleDateString(),
                item.first_name + " " + item.last_name,
                item.payment_method,
                item.status,
                `Rs. ${Number(item.amount).toLocaleString()}`
            ]);
            autoTable(doc, {
                startY: 40,
                head: [['Receipt', 'Date', 'Child', 'Method', 'Status', 'Amount']],
                body: tableData,
            });
        } else if (report.type === 'monthly') {
            const tableData = data.map(item => [
                item.className,
                item.studentCount,
                item.presentDaysSum,
                `Rs. ${Number(item.totalPayments || 0).toLocaleString()}`
            ]);
            autoTable(doc, {
                startY: 40,
                head: [['Class', 'Students', 'Present Count', 'Total Income']],
                body: tableData,
            });
        } else if (report.type === 'history') {
            const { child, attendance, payments, behavior } = data;
            doc.text(`Child Name: ${child.first_name} ${child.last_name}`, 14, 45);
            doc.text(`Enrollment Date: ${child.enrollment_date}`, 14, 52);
            
            doc.text("Attendance History (Top 20)", 14, 65);
            autoTable(doc, {
                startY: 70,
                head: [['Date', 'Status', 'Time']],
                body: attendance.slice(0, 20).map(a => [new Date(a.date).toLocaleDateString(), a.status, a.check_in_time || 'N/A']),
            });

            doc.addPage();
            doc.text("Payment History", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Date', 'Amount', 'Status', 'Method']],
                body: payments.map(p => [new Date(p.payment_date).toLocaleDateString(), `Rs. ${p.amount}`, p.status, p.payment_method]),
            });

            if (behavior && behavior.length > 0) {
                doc.text("Behavior & Remarks", 14, (doc).lastAutoTable.finalY + 15);
                autoTable(doc, {
                    startY: (doc).lastAutoTable.finalY + 20,
                    head: [['Date', 'Rating', 'Category', 'Note', 'Teacher']],
                    body: behavior.map(b => [new Date(b.date).toLocaleDateString(), b.rating, b.category, b.note, b.teacherName]),
                });
            }
        }

        doc.save(`${filename}.pdf`);
    };

    const exportToExcel = (report, data, filename) => {
        let worksheetData = [];
        if (report.type === 'history') {
            const { child, attendance, payments, behavior } = data;
            worksheetData.push(["CHILD HISTORY REPORT"]);
            worksheetData.push(["Name:", `${child.first_name} ${child.last_name}`]);
            worksheetData.push(["Enrollment Date:", child.enrollment_date]);
            worksheetData.push([]);
            worksheetData.push(["ATTENDANCE HISTORY"]);
            worksheetData.push(["Date", "Status", "Time"]);
            attendance.forEach(a => worksheetData.push([new Date(a.date).toLocaleDateString(), a.status, a.check_in_time || 'N/A']));
            worksheetData.push([]);
            worksheetData.push(["PAYMENT HISTORY"]);
            worksheetData.push(["Date", "Amount", "Status", "Method"]);
            payments.forEach(p => worksheetData.push([new Date(p.payment_date).toLocaleDateString(), `Rs. ${p.amount}`, p.status, p.payment_method]));
            if (behavior && behavior.length > 0) {
                worksheetData.push([]);
                worksheetData.push(["BEHAVIOR REMARKS"]);
                worksheetData.push(["Date", "Rating", "Category", "Note", "Teacher"]);
                behavior.forEach(b => worksheetData.push([new Date(b.date).toLocaleDateString(), b.rating, b.category, b.note, b.teacherName]));
            }
        } else if (report.type === 'summary') {
            worksheetData.push(["ALL CLASSES SUMMARY REPORT"]);
            worksheetData.push(["Generated:", new Date().toLocaleString()]);
            worksheetData.push([]);
            worksheetData.push(["Class Name", "Teacher", "Student Count", "Capacity"]);
            data.forEach(item => worksheetData.push([item.name, item.teacherName || 'N/A', item.studentCount, item.capacity]));
        } else if (report.type === 'financial') {
            worksheetData.push(["FINANCIAL / PAYMENT REPORT"]);
            worksheetData.push([]);
            worksheetData.push(["Receipt No", "Date", "Child Name", "Method", "Status", "Amount"]);
            data.forEach(item => worksheetData.push([
                item.receipt_number || 'N/A',
                new Date(item.payment_date).toLocaleDateString(),
                `${item.first_name} ${item.last_name}`,
                item.payment_method,
                item.status,
                item.amount
            ]));
        } else if (report.type === 'monthly') {
            worksheetData.push(["MONTHLY CLASS REPORT"]);
            worksheetData.push(["Month:", months[selectedMonth - 1]]);
            worksheetData.push([]);
            worksheetData.push(["Class Name", "Students", "Present Count (Sum)", "Total Income"]);
            data.forEach(item => worksheetData.push([
                item.className,
                item.studentCount,
                item.presentDaysSum,
                item.totalPayments || 0
            ]));
        }

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Reports Center</h1>
                    <p className="ad-header-subtitle">Generate and export system reports</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="notification">{Icons.bell}</div>
                </div>
            </header>

            {/* Selection Modals / Context Area */}
            {(showMonthPicker || showChildSearch) && (
                <div className="ad-card" style={{ marginBottom: '24px', border: '2px solid var(--ad-accent)', backgroundColor: '#f0fdfa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', color: 'var(--ad-text-primary)' }}>
                            {showMonthPicker ? "Select Month for Report" : "Select Child for History Report"}
                        </h3>
                        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setShowMonthPicker(false); setShowChildSearch(false); }}>Close</button>
                    </div>

                    {showMonthPicker && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {months.map((m, idx) => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMonth(idx + 1)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd',
                                        backgroundColor: selectedMonth === idx + 1 ? 'var(--ad-accent)' : 'white',
                                        color: selectedMonth === idx + 1 ? 'white' : 'black',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}

                    {showChildSearch && (
                        <div>
                            <input
                                type="text"
                                className="ad-input"
                                placeholder="Search child by name..."
                                value={childSearch}
                                onChange={(e) => {
                                    setChildSearch(e.target.value);
                                    fetchChildSearch(e.target.value);
                                }}
                            />
                            {childResults.length > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {childResults.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedChild(c);
                                                setChildSearch(`${c.first_name} ${c.last_name}`);
                                                setChildResults([]);
                                            }}
                                            style={{
                                                padding: '8px 12px', backgroundColor: selectedChild?.id === c.id ? '#e2e8f0' : 'white',
                                                border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            {c.first_name} {c.last_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedChild && (
                                <p style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--ad-accent)' }}>
                                    Selected: {selectedChild.first_name} {selectedChild.last_name}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {reportTypes.map((report) => (
                    <div key={report.id} className="ad-card" style={{ opacity: loading ? 0.7 : 1 }}>
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
                                onClick={() => handleExport(report, 'PDF')}
                                disabled={loading}
                            >
                                {loading ? "..." : "Export PDF"}
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                                onClick={() => handleExport(report, 'Excel')}
                                disabled={loading}
                            >
                                {loading ? "..." : "Export Excel"}
                            </button>
                        </div>
                        {report.type === 'monthly' && selectedMonth && (
                            <p style={{ fontSize: '11px', marginTop: '8px', color: '#64748b' }}>Selected Month: {months[selectedMonth - 1]}</p>
                        )}
                        {report.type === 'history' && selectedChild && (
                            <p style={{ fontSize: '11px', marginTop: '8px', color: '#64748b' }}>Target Child: {selectedChild.first_name}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminReports;
