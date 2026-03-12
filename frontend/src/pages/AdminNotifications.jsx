import React, { useState } from "react";
import { Icons } from "../components/Icons";

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([
        { id: 1, type: "System", message: "System maintenance scheduled for 25th Jan at 10 PM.", time: "2 hours ago", read: false, audience: "Global" },
        { id: 2, type: "Payment", message: "New payment received from Shanaya Perera (ID: REF005).", time: "4 hours ago", read: false, audience: "Admin" },
        { id: 3, type: "Attendance", message: "Teacher 'Ms. Clara' marked absent today.", time: "1 day ago", read: true, audience: "Admin" },
        { id: 4, type: "Enrollment", message: "New child registration request: Nethmi Silva.", time: "2 days ago", read: true, audience: "Admin" },
    ]);

    const [showCompose, setShowCompose] = useState(false);
    const [newMessage, setNewMessage] = useState({ type: "Announcement", message: "", audience: "Both" });

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        if (window.confirm("Clear all notifications?")) {
            setNotifications([]);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        const notification = {
            ...newMessage,
            id: Date.now(),
            time: "Just now",
            read: false
        };
        setNotifications([notification, ...notifications]);
        setShowCompose(false);
        setNewMessage({ type: "Announcement", message: "", audience: "Both" });
        alert(`Notification sent to ${newMessage.audience}!`);
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="ad-header-subtitle">Stay updated with system alerts</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" onClick={() => setShowCompose(true)}>
                        {Icons.plus} Compose Message
                    </button>
                    <button className="btn-secondary" onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>Mark all read</button>
                    <button className="btn-secondary" style={{ color: 'red', borderColor: 'red' }} onClick={clearAll}>Clear all</button>
                </div>
            </header>

            <div className="ad-card" style={{ marginTop: '24px', textAlign: 'left', alignItems: 'flex-start' }}>
                <div style={{ width: '100%' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No notifications</div>
                    ) : (
                        notifications.map((n, i) => (
                            <div key={n.id} style={{ padding: '20px', borderBottom: i === notifications.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', fontSize: '14px' }}>{n.type}</h4>
                                        {n.audience && n.audience !== 'Admin' && (
                                            <span style={{ fontSize: '10px', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                Target: {n.audience}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{n.time}</span>
                                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>Sent Message</span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{n.message}</p>
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
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>New Notification</h2>
                        <form onSubmit={handleSend}>
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
                                </select>
                            </div>
                            <div className="ad-form-group">
                                <label>Notification Category</label>
                                <select
                                    className="ad-select"
                                    value={newMessage.type}
                                    onChange={e => setNewMessage({ ...newMessage, type: e.target.value })}
                                >
                                    <option value="Announcement">Announcement</option>
                                    <option value="Emergency">Emergency Alert</option>
                                    <option value="Event">Event Update</option>
                                    <option value="Maintenance">System Maintenance</option>
                                </select>
                            </div>
                            <div className="ad-form-group">
                                <label>Message Content</label>
                                <textarea
                                    className="ad-input"
                                    style={{ height: '120px', padding: '12px' }}
                                    placeholder="Type your message here..."
                                    required
                                    value={newMessage.message}
                                    onChange={e => setNewMessage({ ...newMessage, message: e.target.value })}
                                />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Send Notification</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
