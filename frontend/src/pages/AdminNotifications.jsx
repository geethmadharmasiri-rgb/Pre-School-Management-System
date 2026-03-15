import React, { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [newMessage, setNewMessage] = useState({ 
        type: "Announcement", 
        message: "", 
        audience: "Both",
        target_user_id: "",
        target_class_id: ""
    });
    const [classes, setClasses] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchNotifications();
        fetchClasses();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/classes", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setClasses(data);
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Clear all notifications from the system?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch("http://localhost:5000/api/notifications/clear-all", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/notifications", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...newMessage,
                    target_user_id: newMessage.target_user_id ? parseInt(newMessage.target_user_id) : null,
                    target_class_id: newMessage.target_class_id ? parseInt(newMessage.target_class_id) : null
                })
            });
            if (res.ok) {
                setShowCompose(false);
                setNewMessage({ type: "Announcement", message: "", audience: "Both", target_user_id: "", target_class_id: "" });
                fetchNotifications();
                alert("Notification sent successfully!");
            } else {
                const err = await res.json();
                alert(err.message || "Failed to send notification");
            }
        } catch (err) {
            console.error("Error sending notification:", err);
            alert("Network error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Notifications Center</h1>
                    <p className="ad-header-subtitle">Manage system-wide and targeted communications</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" onClick={() => setShowCompose(true)}>
                        {Icons.plus} Compose Message
                    </button>
                    <button className="btn-secondary" onClick={() => {
                         const token = localStorage.getItem("token");
                         fetch("http://localhost:5000/api/notifications/mark-all-read", {
                             method: "PUT",
                             headers: { Authorization: `Bearer ${token}` }
                         }).then(() => fetchNotifications());
                    }}>Mark all read</button>
                    <button className="btn-secondary" style={{ color: 'red', borderColor: 'red' }} onClick={clearAll}>Clear all</button>
                </div>
            </header>

            <div className="ad-card" style={{ marginTop: '24px', textAlign: 'left', alignItems: 'flex-start', minHeight: '400px' }}>
                <div style={{ width: '100%' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No notifications found</div>
                    ) : (
                        notifications.map((n, i) => (
                            <div key={n.id} style={{ 
                                padding: '20px', 
                                borderBottom: i === notifications.length - 1 ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: n.is_read ? 'transparent' : '#f8fafc',
                                transition: 'background-color 0.3s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '8px', height: '8px', borderRadius: '50%', 
                                            backgroundColor: n.is_read ? '#cbd5e1' : '#3b82f6' 
                                        }}></div>
                                        <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>{n.type}</h4>
                                        <span style={{ fontSize: '11px', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#475569' }}>
                                            Audience: {n.audience}
                                        </span>
                                        {n.target_user_id && (
                                            <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '12px', color: '#b91c1c' }}>
                                                Private: User #{n.target_user_id}
                                            </span>
                                        )}
                                        {n.target_class_id && (
                                            <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '12px', color: '#0369a1' }}>
                                                Class ID: {n.target_class_id}
                                            </span>
                                        )}
                                        {n.target_class_name && (
                                             <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px', color: '#166534' }}>
                                                Class: {n.target_class_name}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                        {!n.is_read && (
                                            <button 
                                                onClick={() => markAsRead(n.id)}
                                                style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: n.is_read ? '#64748b' : '#334155', paddingLeft: '20px' }}>{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* COMPOSE MODAL */}
            {showCompose && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '550px', margin: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Compose Notification</h2>
                            <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSend}>
                            <div className="ad-form-row">
                                <div className="ad-form-group">
                                    <label>Target Audience</label>
                                    <select
                                        className="ad-select"
                                        value={newMessage.audience}
                                        onChange={e => setNewMessage({ ...newMessage, audience: e.target.value })}
                                    >
                                        <option value="Both">Both Parents & Teachers</option>
                                        <option value="Teachers">Teachers Only</option>
                                        <option value="Parents">Parents Only</option>
                                        <option value="Global">Global (All)</option>
                                        <option value="Admin">Admin Only (Self/Staff)</option>
                                    </select>
                                </div>
                                <div className="ad-form-group">
                                    <label>Category</label>
                                    <select
                                        className="ad-select"
                                        value={newMessage.type}
                                        onChange={e => setNewMessage({ ...newMessage, type: e.target.value })}
                                    >
                                        <option value="Announcement">Announcement</option>
                                        <option value="Emergency">Emergency Alert</option>
                                        <option value="Event">Event Update</option>
                                        <option value="Maintenance">System Maintenance</option>
                                        <option value="Payment">Payment Info</option>
                                        <option value="Attendance">Attendance Info</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ad-form-row">
                                <div className="ad-form-group">
                                    <label>Target Class (Optional)</label>
                                    <select
                                        className="ad-select"
                                        value={newMessage.target_class_id}
                                        onChange={e => setNewMessage({ ...newMessage, target_class_id: e.target.value })}
                                    >
                                        <option value="">Specific Class (None)</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ad-form-group">
                                    <label>Target User ID (Optional)</label>
                                    <input
                                        type="number"
                                        className="ad-input"
                                        placeholder="User ID"
                                        value={newMessage.target_user_id}
                                        onChange={e => setNewMessage({ ...newMessage, target_user_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="ad-form-group">
                                <label>Message Content</label>
                                <textarea
                                    className="ad-input"
                                    style={{ height: '120px', padding: '12px', resize: 'vertical' }}
                                    placeholder="Type your message here..."
                                    required
                                    value={newMessage.message}
                                    onChange={e => setNewMessage({ ...newMessage, message: e.target.value })}
                                />
                            </div>
                            <div className="ad-form-actions" style={{ marginTop: '24px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={sending}>
                                    {sending ? "Sending..." : "Send Notification"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
