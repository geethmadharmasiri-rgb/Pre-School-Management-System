import React, { useState } from "react";
import { Icons } from "../components/Icons";

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/events");
            const data = await res.json();
            setEvents(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchEvents();
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [activeEventId, setActiveEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "" });

    const filteredEvents = (events || []).filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                fetchEvents();
                setShowModal(false);
                setNewEvent({ title: "", date: "", time: "", location: "" });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeEventId) return;

        const formData = new FormData();
        formData.append("images", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/events/${activeEventId}/gallery`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                alert("Photo uploaded successfully!");
                fetchEvents(); // Refresh to show new image in gallery
            } else {
                const data = await res.json();
                alert(data.message || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading photo");
        }
    };

    const handleMarkComplete = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/events/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: "Completed" })
            });
            if (res.ok) fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this event?")) {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/events/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) fetchEvents();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Events & Activities</h1>
                    <p className="ad-header-subtitle">Manage school events and calendar</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="filters-section" style={{ padding: '24px', marginBottom: '32px' }}>
                <div className="search-input-wrapper" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    backgroundColor: '#f8fafc',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <span style={{ width: '20px', height: '20px', color: '#64748b' }}>{Icons.search}</span>
                    <input
                        type="text"
                        placeholder="Search events by title or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            width: '100%',
                            fontSize: '14px',
                            color: '#1e293b',
                            outline: 'none'
                        }}
                    />
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '12px 28px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)' }}>
                    {Icons.plus} Add New Event
                </button>
            </div>


            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredEvents.map(event => (
                    <div key={event.id} className="ad-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <div className="icon big" style={{
                                backgroundColor: event.status === 'Upcoming' ? '#eff6ff' : '#f1f5f9',
                                color: event.status === 'Upcoming' ? '#2563eb' : '#64748b',
                                padding: '12px',
                                borderRadius: '12px'
                            }}>
                                {Icons.events}
                            </div>
                            <span className={`status-badge ${event.status === 'Upcoming' ? 'active' : 'inactive'}`} style={{
                                backgroundColor: event.status === 'Upcoming' ? '#dcfce7' : '#f1f5f9',
                                color: event.status === 'Upcoming' ? '#166534' : '#64748b'
                            }}>
                                {event.status}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', marginTop: '20px', color: 'var(--ad-text-primary)', fontWeight: '600' }}>{event.title}</h3>

                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748b' }}>
                                <span style={{ fontSize: '18px' }}>📅</span>
                                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748b' }}>
                                <span style={{ fontSize: '18px' }}>⏰</span>
                                <span>{event.time}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748b' }}>
                                <span style={{ fontSize: '18px' }}>📍</span>
                                <span>{event.location}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                {event.status === 'Upcoming' && (
                                    <button className="btn-primary btn-small" style={{ flex: 1 }} onClick={() => handleMarkComplete(event.id)}>
                                        Mark Done
                                    </button>
                                )}
                                {event.status === 'Completed' && (
                                    <button className="btn-secondary btn-small" style={{ flex: 1, backgroundColor: '#eff6ff', color: '#2563eb' }} onClick={() => { setActiveEventId(event.id); setShowPhotoModal(true); }}>
                                        Gallery
                                    </button>
                                )}
                                <button className="action-btn delete" style={{ background: '#fff1f2', color: '#e11d48' }} onClick={() => handleDelete(event.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredEvents.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '80px 40px',
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        boxShadow: 'var(--ad-shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#cbd5e1',
                            marginBottom: '20px'
                        }}>
                            <div className="icon big" style={{ width: '40px', height: '40px' }}>{Icons.events}</div>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>No events found</h2>
                        <p style={{ color: '#64748b', margin: '0 0 24px 0', maxWidth: '300px' }}>We couldn't find any events matching "{searchTerm}". Try another search term or create a new event.</p>
                        <button className="btn-secondary" onClick={() => setSearchTerm("")}>Clear Search</button>
                    </div>
                )}
            </div>


            {/* ADD EVENT MODAL */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Add New Event</h2>
                        <form onSubmit={handleAddEvent}>
                            <div className="ad-form-group">
                                <label>Event Title</label>
                                <input className="ad-input" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                            </div>
                            <div className="ad-form-row">
                                <div className="ad-form-group">
                                    <label>Date</label>
                                    <input type="date" className="ad-input" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                </div>
                                <div className="ad-form-group">
                                    <label>Time</label>
                                    <input type="time" className="ad-input" required value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="ad-form-group">
                                <label>Location</label>
                                <input className="ad-input" required value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PHOTO UPLOAD MODAL */}
            {showPhotoModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '600px', margin: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2>Event Photo Gallery</h2>
                            <button onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '14px', color: '#64748b' }}>Select Photo to Upload</label>
                            <input
                                type="file"
                                className="ad-input"
                                style={{ marginTop: '8px' }}
                                onChange={handlePhotoUpload}
                                accept="image/*"
                            />
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <h4 style={{ marginBottom: '16px', color: '#334155' }}>Already Uploaded:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                {events.find(e => e.id === activeEventId)?.images?.map((img, i) => (
                                    <div key={i} style={{
                                        aspectRatio: '1', backgroundColor: '#f1f5f9', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                                        border: '1px solid #e2e8f0', overflow: 'hidden'
                                    }}>
                                        <img
                                            src={img.startsWith('http') ? img : `http://localhost:5000/${img}`}
                                            alt="upload"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                                        />
                                    </div>
                                ))}
                                {(!events.find(e => e.id === activeEventId)?.images || events.find(e => e.id === activeEventId)?.images.length === 0) && (
                                    <p style={{ gridColumn: 'span 4', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No photos uploaded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="ad-form-actions">
                            <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={() => setShowPhotoModal(false)}>Close Gallery</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
