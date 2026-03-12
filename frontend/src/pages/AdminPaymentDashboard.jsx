import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

const AdminPaymentDashboard = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Mock Data
    const [payments, setPayments] = useState([
        { id: "P001", parent: "Ravi Silva", child: "Nethmi Silva", class: "Class A", amount: "5000", date: "2024-01-20", status: "Verified", type: "Online" },
        { id: "P002", parent: "Priya Perera", child: "Shanaya Perera", class: "Class B", amount: "4500", date: "2024-01-19", status: "Pending", type: "Manual" },
        { id: "P003", parent: "Kamal Dias", child: "Aman Dias", class: "Class A", amount: "5000", date: "2024-01-18", status: "Failed", type: "Online" },
        { id: "P004", parent: "Nimali Cooray", child: "Binara Cooray", class: "Class A", amount: "5000", date: "2024-01-18", status: "Verified", type: "Manual" },
    ]);

    // Filtering
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.child.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleApprove = (id) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Verified" } : p));
        setShowModal(false);
    };

    const handleReject = (id) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Failed" } : p));
        setShowModal(false);
    };

    const openVerificationModal = (payment) => {
        setSelectedPayment(payment);
        setShowModal(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Verified": return <span className="status-badge verified">Verified</span>;
            case "Pending": return <span className="status-badge pending">Pending</span>;
            case "Failed": return <span className="status-badge failed">Failed</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Payment Management Dashboard</h1>
                    <p className="ad-header-subtitle">Review parent payments and manage approvals</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            {/* SUMMARY CARDS */}
            <div className="ad-cards">
                <div className="ad-card">
                    <h3>Verified Payments</h3>
                    <p className="ad-card-value">124</p>
                    <div className="icon big" style={{ color: '#15803d', backgroundColor: '#dcfce7' }}>{Icons.check}</div>
                </div>
                <div className="ad-card">
                    <h3>Pending Approvals</h3>
                    <p className="ad-card-value">12</p>
                    <div className="icon big" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>{Icons.clock}</div>
                </div>
                <div className="ad-card">
                    <h3>Manual Payments</h3>
                    <p className="ad-card-value">45</p>
                    <div className="icon big" style={{ color: '#0369a1', backgroundColor: '#e0f2fe' }}>{Icons.payment}</div>
                </div>
            </div>

            {/* STATUS GRAPH PLACEHOLDER */}
            <div className="ad-card" style={{ marginBottom: '24px', alignItems: 'stretch' }}>
                <h3>Payment Status Distribution</h3>
                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                    {/* Simple CSS Bar Chart Visualization */}
                    <div style={{ width: '30%', backgroundColor: '#dcfce7', height: '80%', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                        <span style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Verified</span>
                    </div>
                    <div style={{ width: '30%', backgroundColor: '#fef3c7', height: '30%', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                        <span style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Pending</span>
                    </div>
                    <div style={{ width: '30%', backgroundColor: '#fee2e2', height: '10%', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                        <span style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Failed</span>
                    </div>
                </div>
            </div>

            {/* ACTIONS & FILTERS */}
            <div className="filters-section">
                <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ width: '20px', color: '#94a3b8' }}>{Icons.search}</span>
                    <input
                        type="text"
                        placeholder="Search parent or child name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ad-input"
                        style={{ border: 'none', background: 'transparent', padding: '0' }}
                    />
                </div>

                <select
                    className="ad-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Failed">Failed</option>
                </select>
            </div>

            {/* MAIN TABLE */}
            <div className="table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Parent Name</th>
                            <th>Child Name</th>
                            <th>Class</th>
                            <th>Amount (Rs.)</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(payment => (
                            <tr key={payment.id}>
                                <td>{payment.id}</td>
                                <td>{payment.parent}</td>
                                <td>{payment.child}</td>
                                <td>{payment.class}</td>
                                <td style={{ fontWeight: 600 }}>{payment.amount}</td>
                                <td>{payment.date}</td>
                                <td>{getStatusBadge(payment.status)}</td>
                                <td>
                                    <button className="action-btn view" onClick={() => openVerificationModal(payment)}>View</button>
                                    {payment.status === "Pending" && (
                                        <>
                                            <button className="action-btn approve" onClick={() => handleApprove(payment.id)}>Approve</button>
                                            <button className="action-btn reject" onClick={() => handleReject(payment.id)}>Reject</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No payments found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* BOTTOM ACTIONS */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button className="btn-primary btn-small" onClick={() => navigate('/admin/payments/new')}>
                    <span className="icon">{Icons.plus}</span> Add Manual Payment
                </button>
                <button className="btn-secondary btn-small">
                    <span className="icon">{Icons.reports}</span> Generate Payment Report
                </button>
            </div>

            {/* VERIFICATION MODAL */}
            {showModal && selectedPayment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '32px', borderRadius: '16px',
                        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Payment Verification</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Parent Name</label>
                                <p style={{ fontWeight: 600, margin: '4px 0' }}>{selectedPayment.parent}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Child Name</label>
                                <p style={{ fontWeight: 600, margin: '4px 0' }}>{selectedPayment.child}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Amount</label>
                                <p style={{ fontWeight: 600, margin: '4px 0' }}>Rs. {selectedPayment.amount}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Date Submitted</label>
                                <p style={{ fontWeight: 600, margin: '4px 0' }}>{selectedPayment.date}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Receipt Image</label>
                            <div style={{
                                width: '100%', height: '300px', backgroundColor: '#f8fafc',
                                borderRadius: '12px', border: '2px dashed #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: '10px', overflow: 'hidden'
                            }}>
                                {/* Placeholder for Receipt Image */}
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                                    <p>Receipt Preview<br /><span style={{ fontSize: '12px' }}>(Uploaded by Parent)</span></p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            {selectedPayment.status === "Pending" && (
                                <>
                                    <button className="action-btn reject" style={{ padding: '12px 24px' }} onClick={() => handleReject(selectedPayment.id)}>Reject Payment</button>
                                    <button className="action-btn approve" style={{ padding: '12px 24px' }} onClick={() => handleApprove(selectedPayment.id)}>Approve Payment</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentDashboard;
