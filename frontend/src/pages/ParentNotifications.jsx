import React, { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

export default function ParentNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
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
            console.error(err);
        } finally {
            setLoading(false);
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
            console.error(err);
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="ad-header-subtitle">Stay updated with school announcements and child updates</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => {
                        const token = localStorage.getItem("token");
                        fetch("http://localhost:5000/api/notifications/mark-all-read", {
                            method: "PUT",
                            headers: { Authorization: `Bearer ${token}` }
                        }).then(() => fetchNotifications());
                    }}>Mark all read</button>
                </div>
            </header>

            <div className="ad-card" style={{ marginTop: '24px', textAlign: 'left', alignItems: 'flex-start', minHeight: '400px' }}>
                <div style={{ width: '100%' }}>
                    {loading ? (
                        <p style={{ padding: '20px', textAlign: 'center' }}>Loading updates...</p>
                    ) : notifications.length === 0 ? (
                        <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No notifications to show</p>
                    ) : (
                        notifications.map((n, i) => (
                            <div key={n.id} style={{ 
                                padding: '20px', 
                                borderBottom: i === notifications.length - 1 ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: n.is_read ? 'transparent' : '#f0f9ff'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>}
                                        <h4 style={{ margin: 0, color: '#1e293b' }}>{n.type}</h4>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</span>
                                        {!n.is_read && (
                                            <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>Mark Read</button>
                                        )}
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
