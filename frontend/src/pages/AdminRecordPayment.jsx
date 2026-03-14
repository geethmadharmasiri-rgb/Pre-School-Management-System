import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

const AdminRecordPayment = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        childName: "",
        childId: "",
        parentName: "",
        amount: "",
        paymentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
        paymentMethod: "Cash",
        notes: ""
    });
    const [bankSlip, setBankSlip] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChildIdBlur = async () => {
        if (!formData.childId) return;
        setLoadingInfo(true);
        setMessage({ text: "", type: "" });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/payments/child-info/${formData.childId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    childName: data.childName,
                    parentName: data.parentName,
                    amount: prev.amount || data.globalFee.toString()
                }));
            } else {
                setMessage({ text: "Child not found. Please verify ID.", type: "error" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("token");
            const fd = new FormData();
            fd.append("childId", formData.childId);
            fd.append("amount", formData.amount);
            // Construct a valid YYYY-MM-DD from the selected month (using the 2nd day of the month)
            fd.append("paymentDate", `${formData.paymentMonth}-02`);
            fd.append("paymentMethod", formData.paymentMethod);
            fd.append("notes", formData.notes);
            if (bankSlip) fd.append("bankSlip", bankSlip);

            const res = await fetch("http://localhost:5000/api/admin/payments", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "✅ Payment saved successfully!", type: "success" });
                setTimeout(() => navigate("/admin/payments"), 2000);
            } else {
                setMessage({ text: data.message || "Failed to save payment", type: "error" });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: "Network Error.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Record Manual Payment</h1>
                    <p className="ad-header-subtitle">Manually log payments made by parents (Cash/Bank)</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="ad-form-card">
                {message.text && (
                    <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', 
                        backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: message.type === 'error' ? '#991b1b' : '#15803d' }}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Child ID <span style={{fontSize: '11px', color: '#64748b'}}>(Click 'Fetch' to auto-fill)</span></label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    name="childId"
                                    className="ad-input"
                                    placeholder="e.g. 1"
                                    value={formData.childId}
                                    onChange={handleChange}
                                    required
                                    style={{ flex: 1 }}
                                />
                                <button type="button" onClick={handleChildIdBlur} className="btn-secondary btn-small" style={{ padding: '0 15px' }}>
                                    Fetch
                                </button>
                            </div>
                            {loadingInfo && <span style={{fontSize: '12px', color: '#0ea5e9', display: 'block', marginTop: '4px'}}>Searching for child...</span>}
                        </div>
                        <div className="ad-form-group">
                            <label>Child Name</label>
                            <input
                                type="text"
                                name="childName"
                                className="ad-input"
                                placeholder="Auto-filled child name"
                                value={formData.childName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="ad-form-group">
                        <label>Parent Name</label>
                        <input
                            type="text"
                            name="parentName"
                            className="ad-input"
                            placeholder="Enter parent name"
                            value={formData.parentName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Amount Paid (LKR)</label>
                            <input
                                type="number"
                                name="amount"
                                className="ad-input"
                                placeholder="5000"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="ad-form-group">
                            <label>Target Payment Month</label>
                            <select
                                name="paymentMonth"
                                className="ad-select"
                                value={formData.paymentMonth}
                                onChange={handleChange}
                                required
                            >
                                {(() => {
                                    const opts = [];
                                    const currentYear = new Date().getFullYear();
                                    for(let year = currentYear - 1; year <= currentYear + 1; year++) {
                                        for(let m = 0; m < 12; m++) {
                                            const monthStr = String(m + 1).padStart(2, '0');
                                            const val = `${year}-${monthStr}`;
                                            const name = new Date(year, m).toLocaleString('default', { month: 'long', year: 'numeric' });
                                            opts.push(<option key={val} value={val}>{name}</option>);
                                        }
                                    }
                                    return opts;
                                })()}
                            </select>
                        </div>
                    </div>

                    <div className="ad-form-group">
                        <label>Payment Method</label>
                        <select
                            name="paymentMethod"
                            className="ad-select"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div className="ad-form-group">
                        <label>Bank Slip / Proof of Payment (Optional)</label>
                        <input type="file" name="bankSlip" className="ad-input" onChange={e => setBankSlip(e.target.files[0])} />
                    </div>
                    <div className="ad-form-group">
                        <label>Notes / Comments</label>
                        <textarea
                            name="notes"
                            className="ad-textarea"
                            placeholder="Any additional details..."
                            value={formData.notes}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="ad-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate("/admin/payments")} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminRecordPayment;
