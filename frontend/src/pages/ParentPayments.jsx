import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function ParentPayments() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/parent/payments", {
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
        fetchPayments();
    }, []);

    const getStatusBadge = (status) => {
        if (!status) return <span className="status-badge pending">Due</span>;
        switch (status) {
            case "Paid": return <span className="status-badge verified" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>✅ Paid</span>;
            case "Pending": return <span className="status-badge pending" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>⏳ Processing</span>;
            case "Overdue": return <span className="status-badge failed" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>❌ Overdue</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Payments & Records</h1>
                    <p className="ad-header-subtitle">View your payment history and upload receipts</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="ad-card" style={{ marginTop: '24px', textAlign: 'left', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px' }}>
                    <h3>Payment Status per Child</h3>
                </div>
                <div className="table-container" style={{ width: '100%' }}>
                    {loading ? (
                        <p style={{ padding: '20px', color: '#64748b' }}>Loading records...</p>
                    ) : (
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Child Name</th>
                                    <th>Status Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? (
                                    payments.map((p, idx) => (
                                        <tr key={idx}>
                                            <td>{p.first_name} {p.last_name}</td>
                                            <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "Pending"}</td>
                                            <td>Rs. {parseFloat(p.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                                            <td>{getStatusBadge(p.status)}</td>
                                            <td>
                                                {p.status === "Paid" ? (
                                                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>Submission Closed</span>
                                                ) : (
                                                    <button 
                                                        className="btn-primary btn-small" 
                                                        onClick={() => navigate("/parent/upload-receipt", { 
                                                            state: { 
                                                                child: { id: p.child_id, first_name: p.first_name, last_name: p.last_name } 
                                                            } 
                                                        })}
                                                    >
                                                        {p.status === "Pending" ? "Update Receipt" : "Upload Receipt"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                            No children linked to your account.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
