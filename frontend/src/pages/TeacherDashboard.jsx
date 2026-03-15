import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedYearId } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    const fetchProfile = async () => {
      if (!selectedYearId) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/teacher-login"); return; }

        const res = await fetch(`http://localhost:5000/api/teacher/profile?yearId=${selectedYearId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, selectedYearId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data.slice(0, 5));
    } catch (err) {
      console.error("Teacher notifications fetch error:", err);
    }
  };

  const stats = [
    {
      title: "My Class Children",
      value: profile?.childCount !== undefined ? String(profile.childCount) : "---",
      icon: Icons.child,
      color: "#0ea5e9",
      bg: "#e0f2fe"
    },
    { title: "Today Attendance", value: "---", icon: Icons.attendance, color: "#0f766e", bg: "#ccfbf1" },
    { title: "Pending Homework", value: profile?.homeworkCount !== undefined ? String(profile.homeworkCount) : "0", icon: Icons.reports, color: "#6366f1", bg: "#e0e7ff" },
    {
      title: "Health Alerts",
      value: profile?.healthAlertCount !== undefined ? String(profile.healthAlertCount) : "0",
      icon: Icons.child,
      color: "#f59e0b",
      bg: "#fef3c7"
    },
    {
      title: "New Health Updates",
      value: profile?.recentHealthUpdateCount !== undefined ? String(profile.recentHealthUpdateCount) : "0",
      icon: Icons.plus,
      color: "#10b981",
      bg: "#d1fae5"
    },
  ];

  const recentActivities = [
    { id: 1, text: "Attendance marked for Morning Session", time: "10 mins ago", type: "attendance" },
    { id: 2, text: "Homework 'Alphabet Practice' assigned", time: "2 hours ago", type: "homework" },
    { id: 3, text: "Behavior note added for Shanaya Perera", time: "4 hours ago", type: "behavior" },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="teacher-dashboard" style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <header className="ad-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'none', padding: 0 }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Teacher Overview</h1>
          <p className="ad-header-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
              Welcome back, <span style={{ color: '#0f172a', fontWeight: 600 }}>{profile?.name || "Teacher"}</span>
            </span>
            {profile?.className ? (
              <span style={{
                padding: '8px 18px',
                background: '#ecfdf5',
                color: '#059669',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                border: '2px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
              }}>
                <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)' }}></span>
                {profile.className}
              </span>
            ) : (
              <span style={{
                padding: '8px 18px',
                background: '#fff1f2',
                color: '#e11d48',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                border: '1px solid #ffe4e6',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%' }}></span>
                No Class Assigned
              </span>
            )}
          </p>
        </div>
        <div
          onClick={() => navigate("/teacher/notifications")}
          style={{
            width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0',
            color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
          {Icons.bell}
        </div>
      </header>

      {/* STATS GRID */}
      <div className="ad-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="ad-card"
            style={{
              display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer',
              padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: 'white'
            }}
            onClick={() => {
              if (stat.title === "Today Attendance") navigate('/teacher/attendance');
              if (stat.title === "Pending Homework") navigate('/teacher/homework');
              if (stat.title === "Health Alerts") navigate('/teacher/health-info');
              if (stat.title === "My Class Children") navigate('/teacher/my-class');
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              backgroundColor: stat.bg, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div className="icon" style={{ width: '24px', height: '24px' }}>{stat.icon}</div>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.title}</h3>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '32px' }}>

        {/* LEFT COLUMN: QUICK ACTIONS */}
        <div className="ad-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Quick Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { label: 'Mark Attendance', path: '/teacher/attendance', icon: '📝' },
              { label: 'Add Homework', path: '/teacher/homework', icon: '📚' },
              { label: 'Behavior Report', path: '/teacher/behavior-reports', icon: '✍️' },
              { label: 'Meal Planning', path: '/teacher/meal-planning', icon: '🍱' }
            ].map(action => (
              <button
                key={action.label}
                className="btn-primary"
                onClick={() => navigate(action.path)}
                style={{
                  padding: '16px', borderRadius: '16px', height: 'auto',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                  backgroundColor: '#0f766e', border: 'none', transition: 'filter 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>{action.icon}</span>
                <span style={{ fontWeight: 600 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY (Notifications) */}
        <div className="ad-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '12px', borderRadius: '16px', transition: 'background 0.2s', backgroundColor: n.is_read ? 'transparent' : '#f0f9ff' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', backgroundColor: n.is_read ? '#f1f5f9' : '#e0f2fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: n.is_read ? '#64748b' : '#0284c7'
                }}>
                  {n.type === 'Attendance' ? '📝' : n.type === 'Homework' ? '📚' : n.type === 'Behavior Report' ? '✍️' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: n.is_read ? 500 : 700, color: '#1e293b' }}>{n.message}</p>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )) : (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No recent activity found.</p>
            )}
            {notifications.length > 0 && (
              <button 
                className="btn-secondary" 
                style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/teacher/notifications')}
              >
                View Notification Center
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
