import React, { useState } from "react";
import { Icons } from "../components/Icons";

const TeacherNotifications = () => {
    const [notifications] = useState([
        { id: 1, type: "Announcement", message: "Reminder: Staff meeting tomorrow at 3 PM in the lounge.", time: "1 hour ago" },
        { id: 2, type: "Maintenance", message: "School Wi-Fi will be down for maintenance from 6 PM to 8 PM tonight.", time: "5 hours ago" },
        { id: 3, type: "Event", message: "The 'Art Exhibition' photos are now available in the gallery.", time: "1 day ago" },
    ]);

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Teacher Notifications</h1>
                    <p className="ad-header-subtitle">Important announcements and system alerts</p>
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
                                    <h4 style={{ margin: 0, color: '#0f172a' }}>{n.type}</h4>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{n.time}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherNotifications;
