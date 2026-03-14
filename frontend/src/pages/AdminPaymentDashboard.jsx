import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

const AdminPaymentDashboard = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editableAmount, setEditableAmount] = useState("");

    const [payments, setPayments] = useState([]);
    const [globalFee, setGlobalFee] = useState(5000);
    const [feeInput, setFeeInput] = useState("");
    const [feeUpdating, setFeeUpdating] = useState(false);

    const fetchFee = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/fee-settings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setGlobalFee(parseFloat(data.monthly_fee));
            setFeeInput(parseFloat(data.monthly_fee).toString());
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateGlobalFee = async () => {
        const parsed = parseFloat(feeInput);
        if (isNaN(parsed) || parsed <= 0) {
            alert("Please enter a valid fee amount.");
            return;
        }
        setFeeUpdating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/fee-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ monthly_fee: parsed })
            });
            if (res.ok) {
                const data = await res.json();
                setGlobalFee(data.monthly_fee);
                fetchPayments(); // refresh the table with new amounts
                alert(`✅ Monthly fee updated to Rs. ${data.monthly_fee} for all pending payments!`);
            } else {
                alert("Failed to update fee.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFeeUpdating(false);
        }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/payments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPayments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchFee();
    }, []);

    // Filtering
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.child.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const updatePaymentStatus = async (id, status, amount) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/payments/${id}/status`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ status, amount })
            });
            if (res.ok) {
                fetchPayments(); // refresh list
                setShowModal(false);
            } else {
                alert("Failed to update payment status");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateAmount = (id, amount) => {
        const payment = payments.find(p => p.id === id);
        if (!payment) return;
        updatePaymentStatus(id, payment.status === 'Verified' ? 'Verified' : (payment.status === 'Failed' ? 'Failed' : 'Pending'), amount);
    };

    const handleApprove = (id, amount) => {
        updatePaymentStatus(id, "Verified", amount);
    };

    const handleReject = (id, amount) => {
        updatePaymentStatus(id, "Failed", amount);
    };


    const openVerificationModal = (payment) => {
        setSelectedPayment(payment);
        setEditableAmount(payment.amount);
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

    const verifiedCount = payments.filter(p => p.status === 'Verified').length;
    const pendingCount = payments.filter(p => p.status === 'Pending').length;
    const manualCount = payments.filter(p => p.type === 'Manual' || p.type === 'Cash').length;
    
    // Calculate simple percentages for the chart
    const total = verifiedCount + pendingCount + payments.filter(p => p.status === 'Failed').length || 1;
    const verifiedPct = (verifiedCount / total) * 100;
    const pendingPct = (pendingCount / total) * 100;
    const failedPct = (payments.filter(p => p.status === 'Failed').length / total) * 100;

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Payment Management Dashboard</h1>
                    <p className="ad-header-subtitle">Review parent payments and manage approvals</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>
            {/* GLOBAL FEE EDITOR */}
            <div style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                boxShadow: '0 4px 20px rgba(14, 165, 233, 0.3)'
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        💰 Monthly Fee Setting
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '24px', fontWeight: 800, color: 'white' }}>
                        Rs. {parseFloat(globalFee).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        Current monthly fee applied to all pending payments
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>New Amount (Rs.)</p>
                        <input
                            type="number"
                            min="0"
                            step="100"
                            value={feeInput}
                            onChange={e => setFeeInput(e.target.value)}
                            style={{
                                width: '160px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '2px solid rgba(255,255,255,0.4)',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 700,
                                outline: 'none'
                            }}
                            placeholder="e.g. 10000"
                        />
                    </div>
                    <button
                        onClick={handleUpdateGlobalFee}
                        disabled={feeUpdating}
                        style={{
                            marginTop: '18px',
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '14px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        {feeUpdating ? '⏳ Updating...' : '✅ Apply to All'}
                    </button>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="ad-cards">
                <div className="ad-card">
                    <h3>Verified Payments</h3>
                    <p className="ad-card-value">{verifiedCount}</p>
                    <div className="icon big" style={{ color: '#15803d', backgroundColor: '#dcfce7' }}>{Icons.check}</div>
                </div>
                <div className="ad-card">
                    <h3>Pending Approvals</h3>
                    <p className="ad-card-value">{pendingCount}</p>
                    <div className="icon big" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>{Icons.clock}</div>
                </div>
                <div className="ad-card">
                    <h3>Manual/Cash Payments</h3>
                    <p className="ad-card-value">{manualCount}</p>
                    <div className="icon big" style={{ color: '#0369a1', backgroundColor: '#e0f2fe' }}>{Icons.payment}</div>
                </div>
            </div>

            {/* STATUS GRAPH */}
            <div className="ad-card" style={{ marginBottom: '24px', alignItems: 'stretch' }}>
                <h3>Payment Status Distribution</h3>
                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '30%', backgroundColor: '#dcfce7', height: `${Math.max(10, verifiedPct)}%`, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.3s' }}>
                        <span style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Verified</span>
                    </div>
                    <div style={{ width: '30%', backgroundColor: '#fef3c7', height: `${Math.max(5, pendingPct)}%`, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.3s' }}>
                        <span style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Pending</span>
                    </div>
                    <div style={{ width: '30%', backgroundColor: '#fee2e2', height: `${Math.max(5, failedPct)}%`, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.3s' }}>
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
                                <td style={{ fontWeight: 600 }}>
                                    {payment.amount}
                                    <span style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '10px', opacity: 0.6 }} title="Click View to Edit">📝</span>
                                </td>
                                <td>{payment.date}</td>
                                 <td>
                                     {getStatusBadge(payment.status)}
                                     {payment.has_receipt && (
                                         <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>📎 Receipt</span>
                                     )}
                                 </td>
                                <td>
                                    <button className="action-btn view" onClick={() => openVerificationModal(payment)}>View</button>
                                    {payment.status === "Pending" && (
                                        <>
                                            <button className="action-btn approve" onClick={() => handleApprove(payment.id, payment.amount)}>Approve</button>
                                            <button className="action-btn reject" onClick={() => handleReject(payment.id, payment.amount)}>Reject</button>
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
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Amount (LKR)</label>
                                <input 
                                    type="number" 
                                    className="ad-input" 
                                    style={{ marginTop: '4px', fontWeight: 700, fontSize: '16px', color: '#0f172a' }}
                                    value={editableAmount}
                                    onChange={(e) => setEditableAmount(e.target.value)}
                                />
                                <p style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Admin can update amount if needed</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Date Submitted</label>
                                <p style={{ fontWeight: 600, margin: '4px 0' }}>{selectedPayment.date}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Receipt Image
                                {selectedPayment.has_receipt 
                                    ? <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>✅ Receipt Uploaded by Parent</span>
                                    : <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>⏳ No Receipt Yet</span>
                                }
                            </label>
                            <div style={{
                                width: '100%', minHeight: '200px', backgroundColor: '#f8fafc',
                                borderRadius: '12px', border: '2px dashed #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: '10px', overflow: 'hidden'
                            }}>
                                {selectedPayment.receipt_url ? (
                                    <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
                                        <img
                                            src={selectedPayment.receipt_url}
                                            alt="Payment Receipt"
                                            style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '10px' }}
                                            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                        />
                                        <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', padding: '20px' }}>
                                            <div style={{ fontSize: '40px' }}>📄</div>
                                            <p>Click to open receipt file</p>
                                        </div>
                                    </a>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                                        <p>No receipt uploaded yet<br /><span style={{ fontSize: '12px' }}>Waiting for parent to submit</span></p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            
                            {/* Always allow updating the amount */}
                            <button 
                                className="btn-primary" 
                                style={{ backgroundColor: '#0ea5e9', padding: '12px 24px' }}
                                onClick={() => handleUpdateAmount(selectedPayment.id, editableAmount)}
                            >
                                💾 Update Amount Only
                            </button>

                            {selectedPayment.status === "Pending" && (
                                <>
                                    <button className="action-btn reject" style={{ padding: '12px 24px' }} onClick={() => handleReject(selectedPayment.id, editableAmount)}>Reject Payment</button>
                                    <button className="action-btn approve" style={{ padding: '12px 24px' }} onClick={() => handleApprove(selectedPayment.id, editableAmount)}>Approve Payment</button>
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
