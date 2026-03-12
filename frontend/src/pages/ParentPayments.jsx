import React from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function ParentPayments() {
    const navigate = useNavigate();
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
                    <h3>Current Dues</h3>
                </div>
                <div className="table-container" style={{ width: '100%' }}>
                    <table className="ad-table">
                        <thead>
                            <tr>
                                <th>Child Name</th>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Shanaya Perera</td>
                                <td>January 2026</td>
                                <td>Rs. 15,000</td>
                                <td><span className="status-badge pending">Due</span></td>
                                <td><button className="btn-primary btn-small" onClick={() => navigate("/parent/upload-receipt", { state: { child: { id: 1, first_name: "Shanaya", last_name: "Perera" } } })}>Upload Receipt</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
