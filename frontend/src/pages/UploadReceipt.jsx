import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function UploadReceipt() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get child info from navigation state if available
    const initialChild = location.state?.child || null;

    const [selectedChild, setSelectedChild] = useState(initialChild?.id || "");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receipt, setReceipt] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceipt(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedChild || !amount || !receipt) {
            setMessage({ text: "Please fill all fields and select a receipt image.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: "", type: "" });

        // Simulate upload for now (Backend might need adjustment for file uploads)
        setTimeout(() => {
            setIsSubmitting(false);
            setMessage({ text: "Receipt uploaded successfully! Pending administrator verification.", type: "success" });
            setTimeout(() => navigate("/parent/payments"), 2000);
        }, 1500);
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
                                {initialChild ? `${initialChild.first_name} ${initialChild.last_name}` : "No child selected"}
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
                            <label>Reference (Optional)</label>
                            <input
                                type="text"
                                className="ad-input"
                                placeholder="Bank Ref No."
                            />
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
