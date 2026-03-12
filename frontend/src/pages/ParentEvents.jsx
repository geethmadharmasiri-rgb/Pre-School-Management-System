import React from "react";
import { Icons } from "../components/Icons";

export default function ParentEvents() {
    const [events, setEvents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showGallery, setShowGallery] = React.useState(false);
    const [activeEvent, setActiveEvent] = React.useState(null);

    const fetchEvents = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/events");
            const data = await res.json();

            // Map common icons/colors for UI consistency
            const uiMappedData = (data || []).map((ev, i) => ({
                ...ev,
                emoji: ev.title.toLowerCase().includes('sport') ? "🏆" :
                    ev.title.toLowerCase().includes('parent') ? "👨‍👩‍👧‍👦" :
                        ev.title.toLowerCase().includes('art') ? "🎨" : "📅",
                color: ["#fff7ed", "#f0fdf4", "#eff6ff", "#fdf2f8"][i % 4]
            }));

            setEvents(uiMappedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchEvents();
    }, []);

    const upcomingEvents = events.filter(e => e.status.toLowerCase() === "upcoming");
    const completedEvents = events.filter(e => e.status.toLowerCase() === "completed");

    const openGallery = (event) => {
        setActiveEvent(event);
        setShowGallery(true);
    };

    const renderEventCard = (event, i) => (
        <div key={event.id || i} className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: event.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '16px' }}>
                    {event.emoji}
                </div>
                <span className={`status-badge ${event.status.toLowerCase() === 'upcoming' ? 'active' : 'inactive'}`}>
                    {event.status}
                </span>
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>{event.title}</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {new Date(event.date).toLocaleDateString()} {event.time ? ` at ${event.time}` : ''}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>📍 {event.location || 'School Campus'}</p>

            {event.status.toLowerCase() === "upcoming" ? (
                <button className="btn-secondary" style={{ marginTop: '20px', width: '100%' }}>Remind Me</button>
            ) : (
                <button
                    className="btn-primary"
                    style={{ marginTop: '20px', width: '100%', backgroundColor: '#8b5cf6' }}
                    onClick={() => openGallery(event)}
                >
                    View Gallery ({event.images?.length || 0})
                </button>
            )}
        </div>
    );

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>School Events</h1>
                    <p className="ad-header-subtitle">Stay updated with our latest activities</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <section style={{ marginTop: '32px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#0f172a' }}>Upcoming Events</h2>
                <div className="ad-cards">
                    {upcomingEvents.map((event, i) => renderEventCard(event, i))}
                </div>
            </section>

            <section style={{ marginTop: '48px', paddingBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#0f172a' }}>Completed Activities</h2>
                <div className="ad-cards">
                    {completedEvents.map((event, i) => renderEventCard(event, i))}
                </div>
            </section>

            {/* GALLERY MODAL */}
            {showGallery && activeEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{activeEvent.title} Gallery</h2>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{activeEvent.date}</p>
                            </div>
                            <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {activeEvent.images && activeEvent.images.map((img, i) => (
                                <div key={i} style={{
                                    aspectRatio: '1', backgroundColor: '#f1f5f9', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                                    border: '1px solid #e2e8f0', overflow: 'hidden'
                                }}>
                                    <img
                                        src={img.startsWith('http') ? img : `http://localhost:5000/${img}`}
                                        alt="event"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found'; }}
                                    />
                                </div>
                            ))}
                            {(!activeEvent.images || activeEvent.images.length === 0) && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No photos available for this event.
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <button className="btn-primary" onClick={() => setShowGallery(false)}>Close Gallery</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
