import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function UploadReceipt() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialChild = location.state?.child || null;

    const [selectedChild] = useState(initialChild || null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
    const [receipt, setReceipt] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Pre-fill the default fee from backend
    useEffect(() => {
        const loadFee = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/admin/fee-settings", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAmount(parseFloat(data.monthly_fee).toString());
                }
            } catch (e) { /* silently fail */ }
        };
        loadFee();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceipt(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedChild) {
            setMessage({ text: "No child selected. Please go back and select a child.", type: "error" });
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setMessage({ text: "Please enter a valid payment amount.", type: "error" });
            return;
        }
        if (!receipt) {
            setMessage({ text: "Please attach your payment receipt image.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("child_id", selectedChild.id);
            formData.append("amount", amount);
            formData.append("payment_date", date);
            formData.append("payment_method", paymentMethod);
            formData.append("reference", reference);
            formData.append("receipt", receipt);

            const res = await fetch("http://localhost:5000/api/parent/payments/submit", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "✅ Receipt submitted successfully! Pending administrator verification.", type: "success" });
                setTimeout(() => navigate("/parent/payments"), 2500);
            } else {
                setMessage({ text: data.message || "Upload failed. Please try again.", type: "error" });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: "Network error. Please check your connection.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="ad-header">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', color: 'var(--ad-accent)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}
                    >
                        ← Back
                    </button>
                    <h1>Upload Payment Receipt</h1>
                    <p className="ad-header-subtitle">Submit your bank transfer or deposit receipt for verification</p>
                </div>
            </header>

            <div className="ad-form-card" style={{ marginTop: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Child Name</label>
                            <div className="ad-input" style={{ backgroundColor: '#f1f5f9', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                                {selectedChild ? `${selectedChild.first_name || selectedChild.first_name} ${selectedChild.last_name || ""}`.trim() : "No child selected"}
                            </div>
                        </div>
                        <div className="ad-form-group">
                            <label>Payment Amount (Rs.)</label>
                            <input
                                type="number"
                                className="ad-input"
                                placeholder="e.g. 5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Payment Date</label>
                            <input
                                type="date"
                                className="ad-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="ad-form-group">
                            <label>Payment Method</label>
                            <select
                                className="ad-select"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Online">Online Transfer</option>
                                <option value="Cash">Cash Deposit</option>
                            </select>
                        </div>
                    </div>

                    <div className="ad-form-group" style={{ marginTop: '20px' }}>
                        <label>Upload Receipt Image</label>
                        <div
                            style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '12px',
                                padding: '40px',
                                textAlign: 'center',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => document.getElementById('receipt-upload').click()}
                        >
                            {preview ? (
                                <img src={preview} alt="Receipt Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                            ) : (
                                <div>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📷</div>
                                    <p style={{ color: '#64748b', margin: 0 }}>Click to select or drag & drop receipt image</p>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>PNG, JPG or PDF up to 5MB</span>
                                </div>
                            )}
                            <input
                                id="receipt-upload"
                                type="file"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#15803d' : '#991b1b',
                            fontWeight: 500
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div className="ad-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Uploading..." : "Submit Receipt"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="ad-card" style={{ marginTop: '30px', backgroundColor: '#f0fdfa', border: 'none' }}>
                <h4 style={{ color: '#0f766e', marginTop: 0 }}>Instructions:</h4>
                <ul style={{ color: '#134e4a', fontSize: '14px', paddingLeft: '20px', margin: 0 }}>
                    <li>Please ensure the receipt image is clear and all details are visible.</li>
                    <li>Payments are usually verified within 24-48 hours.</li>
                    <li>For immediate assistance, contact the school office.</li>
                </ul>
            </div>
        </div>
    );
}
