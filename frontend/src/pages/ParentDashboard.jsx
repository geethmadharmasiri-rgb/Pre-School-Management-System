import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [contactData, setContactData] = useState({ phone: "", address: "" });
  const [userName, setUserName] = useState("Parent");
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      } catch (e) { }
    }
    fetchChildren();
    fetchEvents();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data.slice(0, 3));
    } catch (err) {
      console.error("Dashboard notifications fetch error:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      const upcoming = (data || [])
        .filter(ev => ev.status.toLowerCase() === 'upcoming')
        .slice(0, 2)
        .map(ev => ({
          ...ev,
          emoji: ev.title.toLowerCase().includes('sport') ? "🏆" :
            ev.title.toLowerCase().includes('parent') ? "👨‍👩‍👧‍👦" : "📅"
        }));
      setEvents(upcoming);
    } catch (err) {
      console.error("Dashboard events fetch error:", err);
    }
  };


  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/children?scope=my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (child) => {
    setEditingChild(child);
    setContactData({ phone: child.contactNumber || "", address: child.address || "" });
    setShowEditModal(true);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/children/${editingChild.id}/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });
      if (res.ok) {
        alert("Contact updated!");
        setShowEditModal(false);
        fetchChildren();
      }
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Parent Dashboard</h1>
          <p className="ad-header-subtitle">Welcome back, {userName}</p>
        </div>

        <div className="notification">{Icons.bell}</div>
      </header>

      {/* STATS GRID */}
      <div className="ad-cards">
        <div className="ad-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: "#e0f2fe", color: "#0ea5e9",
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="icon big">{Icons.child}</div>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: '0 0 4px 0' }}>My Children</h3>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{children.length}</div>
          </div>
        </div>
        <div className="ad-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: "#fef3c7", color: "#f59e0b",
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="icon big">{Icons.bell}</div>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: '0 0 4px 0' }}>Notifications</h3>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{notifications.filter(n => !n.is_read).length}</div>
          </div>
        </div>
      </div>




      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h2>Edit Contact Info</h2>
            <form onSubmit={saveContact}>
              <div className="ad-form-group">
                <label>Phone Number</label>
                <input
                  className="ad-input"
                  value={contactData.phone}
                  onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="ad-form-group">
                <label>Address</label>
                <textarea
                  className="ad-input"
                  style={{ height: '80px', padding: '12px' }}
                  value={contactData.address}
                  onChange={e => setContactData({ ...contactData, address: e.target.value })}
                  required
                />
              </div>
              <div className="ad-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}


      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginTop: '32px' }}>
        {/* LEFT COLUMN: CHILD PROFILES */}
        <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>My Children</h3>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/parent/children')}>View All</button>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {children.length > 0 ? (
              children.slice(0, 3).map((child) => (
                <div
                  key={child.id}
                  onClick={() => child.status === 'approved' && navigate(`/parent/child-profile/${child.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    cursor: child.status === 'approved' ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => child.status === 'approved' && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                >
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {child.profile_picture ? (
                      <img src={`http://localhost:5000/${child.profile_picture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>{child.gender === 'Female' ? '👧' : '👦'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{child.first_name} {child.last_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{child.className || "Assigning Class..."}</div>
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                    backgroundColor: child.status === 'approved' ? '#dcfce7' : '#ffedd5',
                    color: child.status === 'approved' ? '#15803d' : '#9a3412'
                  }}>
                    {child.status ? child.status.charAt(0).toUpperCase() + child.status.slice(1) : 'Pending'}
                  </div>
                  {child.status === 'approved' && <div style={{ color: '#94a3b8' }}>→</div>}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No children enrolled yet.</p>
                <button className="link-button" onClick={() => navigate('/parent/children')} style={{ marginTop: '8px' }}>Enroll a child now</button>
              </div>
            )}
            {children.length > 3 && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                + {children.length - 3} more children
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EVENTS & NOTIFICATIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ad-card" style={{ cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start' }} onClick={() => navigate('/parent/events')}>
            <h3 style={{ marginBottom: '20px' }}>Upcoming Events</h3>
            <div style={{ width: '100%' }}>
              {events.length > 0 ? events.map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: i === 0 && events.length > 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{event.emoji}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{event.title}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No upcoming events.</p>
              )}
            </div>
          </div>

          <div className="ad-card" style={{ textAlign: 'left', alignItems: 'flex-start' }} onClick={() => navigate('/parent/notifications')}>
            <h3 style={{ marginBottom: '15px' }}>Recent Notifications</h3>
            <div style={{ width: '100%', marginBottom: '15px' }}>
              {notifications.length > 0 ? notifications.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px', borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '8px' }}>
                  <div style={{ backgroundColor: n.is_read ? '#f1f5f9' : '#eff6ff', padding: '6px', borderRadius: '8px', color: n.is_read ? '#64748b' : '#3b82f6' }}>{Icons.bell}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: n.is_read ? '#64748b' : '#1e293b', margin: 0, fontWeight: n.is_read ? 400 : 600 }}>{n.message}</p>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No recent updates.</p>
              )}
            </div>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/parent/notifications')}>View All</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
