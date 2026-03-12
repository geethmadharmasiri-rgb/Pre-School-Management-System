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
        paymentDate: "",
        paymentMethod: "Cash",
        notes: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Implement save logic here
        console.log("Saving payment:", formData);
        // Mock success and redirect
        navigate("/admin/payments");
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
                <form onSubmit={handleSubmit}>
                    <div className="ad-form-row">
                        <div className="ad-form-group">
                            <label>Child Name</label>
                            <input
                                type="text"
                                name="childName"
                                className="ad-input"
                                placeholder="Enter child name"
                                value={formData.childName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="ad-form-group">
                            <label>Child ID</label>
                            <input
                                type="text"
                                name="childId"
                                className="ad-input"
                                placeholder="e.g. ILA-CH-001"
                                value={formData.childId}
                                onChange={handleChange}
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
                            <label>Payment Date</label>
                            <input
                                type="date"
                                name="paymentDate"
                                className="ad-input"
                                value={formData.paymentDate}
                                onChange={handleChange}
                                required
                            />
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
                        <label>Bank Slip / Proof of Payment</label>
                        <input type="file" name="bankSlip" className="ad-input" />
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
                        <button type="button" className="btn-secondary" onClick={() => navigate("/admin/payments")}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Save Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminRecordPayment;
