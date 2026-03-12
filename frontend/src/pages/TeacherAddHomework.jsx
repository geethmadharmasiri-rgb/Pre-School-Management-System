import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

const TeacherAddHomework = () => {
    const navigate = useNavigate();
    const { selectedYearId } = useOutletContext();
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("due_date", dueDate);
        formData.append("description", description);
        if (selectedYearId) {
            formData.append("yearId", selectedYearId);
        }
        if (file) {
            formData.append("homeworkFile", file);
        }

        try {
            const response = await fetch("http://localhost:5000/api/homework", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert("Homework assigned successfully!");
                navigate("/teacher/homework");
            } else {
                const data = await response.json();
                alert(data.message || "Failed to assign homework");
            }
        } catch (err) {
            console.error("Error assigning homework:", err);
            alert("Server error. Please try again.");
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Add New Homework</h1>
                    <p className="ad-header-subtitle">Create a new assignment for your class</p>
                </div>
            </header>

            <div className="ad-form-card" style={{ maxWidth: '800px', margin: '20px auto' }}>
                <form onSubmit={handleSubmit}>
                    <div className="ad-form-group">
                        <label>Date / Due Date *</label>
                        <input
                            type="date"
                            className="ad-input"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="ad-form-group">
                        <label>Subject *</label>
                        <select
                            className="ad-select"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        >
                            <option value="">Select subject...</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="English">English</option>
                            <option value="Art">Art</option>
                            <option value="Science">Science</option>
                            <option value="Music">Music</option>
                            <option value="Physical Education">Physical Education</option>
                            <option value="General">General</option>
                        </select>
                    </div>

                    <div className="ad-form-group">
                        <label>Activity / Assignment Title *</label>
                        <input
                            className="ad-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder="e.g. Trace the number '4', Color the butterfly"
                        />
                    </div>

                    <div className="ad-form-group">
                        <label>Attach Materials (Video, Image, Document) - Optional</label>
                        <div style={{
                            border: '2px dashed #e2e8f0',
                            borderRadius: '8px',
                            padding: '32px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc'
                        }} onClick={() => document.getElementById('file-upload').click()}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                            <p style={{ margin: 0, color: '#64748b' }}>
                                Click to upload or drag and drop<br />
                                <span style={{ fontSize: '12px' }}>Supported: MP4, JPG, PNG, PDF, DOC</span>
                            </p>
                            <input
                                id="file-upload"
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="video/*,image/*,.pdf,.doc,.docx"
                            />
                        </div>
                        {file && (
                            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>✅</span> {file.name}
                            </div>
                        )}
                    </div>

                    <div className="ad-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate("/teacher/homework")}>Cancel</button>
                        <button type="submit" className="btn-primary">Assign Homework</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherAddHomework;
