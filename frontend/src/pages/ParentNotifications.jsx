import React from "react";
import { Icons } from "../components/Icons";

export default function ParentNotifications() {
    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="ad-header-subtitle">Stay updated with school announcements</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="ad-card" style={{ marginTop: '24px', textAlign: 'left', alignItems: 'flex-start' }}>
                <div style={{ width: '100%' }}>
                    {[
                        { title: "Art Exhibition Reminder", text: "Don't forget the Art exhibition tomorrow at 10 AM.", time: "2 hours ago" },
                        { title: "Payment Successful", text: "Your payment for December 2025 has been confirmed.", time: "1 day ago" },
                        { title: "School Holiday", text: "School will be closed on Friday due to a local festival.", time: "3 days ago" },
                    ].map((n, i) => (
                        <div key={i} style={{ padding: '20px', borderBottom: i === 2 ? 'none' : '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0 }}>{n.title}</h4>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{n.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{n.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
