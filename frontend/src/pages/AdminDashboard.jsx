import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { selectedYearId } = useOutletContext();
  const [counts, setCounts] = useState({ totalChildren: 0, totalTeachers: 0, totalClasses: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedYearId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/admin/stats?yearId=${selectedYearId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCounts(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
  }, [selectedYearId]);

  // Mock Data for Dashboard
  const stats = [
    { title: "Total Children", value: counts.totalChildren, icon: Icons.child, color: "#0ea5e9", bg: "#e0f2fe" },
    { title: "Total Teachers", value: counts.totalTeachers, icon: Icons.teacher, color: "#0f766e", bg: "#ccfbf1" },
    { title: "Classes", value: counts.totalClasses, icon: Icons.class, color: "#6366f1", bg: "#e0e7ff" },
  ];

  const recentActivities = [
    { id: 1, text: "New child 'Shanaya Perera' registered", time: "2 mins ago", type: "child" },
    { id: 2, text: "Payment received from Priya Perera", time: "1 hour ago", type: "payment" },
    { id: 3, text: "Teacher 'Ms. Clara' added attendance", time: "3 hours ago", type: "attendance" },
    { id: 4, text: "System maintenance scheduled", time: "1 day ago", type: "system" },
  ];

  const upcomingEvents = [
    { id: 1, title: "Annual Sports Day", date: "2024-03-15", time: "09:00 AM", emoji: "🏆" },
    { id: 2, title: "Parents Meeting", date: "2024-02-10", time: "10:00 AM", emoji: "👨‍👩‍👧‍👦" },
    { id: 3, title: "Art Exhibition", date: "2024-01-25", time: "11:00 AM", emoji: "🎨" },
  ];

  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="ad-header-subtitle">Welcome back, Administrator</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="notification">{Icons.bell}</div>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="ad-cards">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="ad-card"
            style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
            onClick={() => {
              if (stat.title === "Total Children") navigate('/admin/children');
              if (stat.title === "Total Teachers") navigate('/admin/teachers');
              if (stat.title === "Classes") navigate('/admin/classes');
            }}
          >
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: stat.bg, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div className="icon big">{stat.icon}</div>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: '0 0 4px 0' }}>{stat.title}</h3>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '24px', marginTop: '32px' }}>

        {/* LEFT COLUMN: ATTENDANCE CHART */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Income Overview (Simple Visualization) */}
          <div className="ad-card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--ad-text-primary)' }}>Monthly Attendance</h3>
              <select className="ad-select" style={{ width: 'auto', padding: '6px 12px' }}>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>

            {/* Refined Bar Chart */}
            <div style={{ position: 'relative', height: '320px', width: '100%', marginTop: '40px' }}>
              {/* Y-Axis Labels & Grid Lines */}
              {[100, 75, 50, 25, 0].map((level) => (
                <div key={level} style={{
                  position: 'absolute',
                  top: `${100 - level}%`,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  height: '0'
                }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', width: '30px', textAlign: 'right', marginRight: '10px', transform: 'translateY(-1px)' }}>{level}%</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: level === 0 ? '#cbd5e1' : '#f1f5f9' }}></div>
                </div>
              ))}

              {/* Bars Container */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '40px',
                right: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingRight: '10px'
              }}>
                {(counts.attendanceStats && counts.attendanceStats.length > 0
                  ? counts.attendanceStats
                  : [
                    { percentage: 65, day: 'Mon' },
                    { percentage: 80, day: 'Tue' },
                    { percentage: 55, day: 'Wed' },
                    { percentage: 90, day: 'Thu' },
                    { percentage: 75, day: 'Fri' },
                    { percentage: 60, day: 'Sat' },
                    { percentage: 85, day: 'Sun' }
                  ]
                ).map((record, i) => {
                  const h = Math.max(record.percentage || 0, 2); // Show at least a sliver
                  const dayName = record.day || (record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }) : '');
                  const isToday = dayName === new Date().toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <div key={i} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative'
                    }}>
                      <div
                        title={`${h}% Attendance`}
                        style={{
                          width: '60%', // Adjust bar width relative to column
                          maxWidth: '40px',
                          borderRadius: '6px 6px 2px 2px',
                          backgroundColor: isToday ? 'var(--ad-accent)' : '#94a3b8',
                          height: `${h}%`,
                          opacity: 0.85,
                          transition: 'height 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          boxShadow: isToday ? '0 4px 12px rgba(15, 118, 110, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                          cursor: 'pointer',
                          marginBottom: '30px' // Space for label
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.85'}
                      ></div>
                      <span style={{
                        position: 'absolute',
                        bottom: '0',
                        fontSize: '11px',
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--ad-accent)' : '#64748b',
                        whiteSpace: 'nowrap'
                      }}>
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>

        </div>

        {/* MIDDLE COLUMN: QUICK ACTIONS */}
        <div className="ad-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--ad-text-primary)' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <button
              className="ad-card"
              onClick={() => navigate('/admin/parents')}
              style={{
                padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <div style={{ backgroundColor: '#fff7ed', padding: '8px', borderRadius: '8px' }}>👨‍👩‍👧‍👦</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Enrollment Approvals</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Review pending parent requests</div>
              </div>
            </button>
            <button
              className="ad-card"
              onClick={() => navigate('/admin/classes')}
              style={{
                padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '8px' }}>🏫</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Class Allocation</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Assign children to classes</div>
              </div>
            </button>
            <button
              className="ad-card"
              onClick={() => navigate('/admin/academic-years')}
              style={{
                padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '8px' }}>📅</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Academic Sessions</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Manage years and terms</div>
              </div>
            </button>
          </div>

          <h3 style={{ fontSize: '18px', margin: '24px 0 20px 0', color: 'var(--ad-text-primary)' }}>Upcoming Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingEvents.map(event => (
              <div key={event.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff7ed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                  {event.emoji}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500, color: '#334155' }}>{event.title}</p>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{event.date} • {event.time}</span>
                </div>
              </div>
            ))}
            <button
              style={{ background: 'none', border: 'none', color: 'var(--ad-accent)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', textAlign: 'left' }}
              onClick={() => navigate('/admin/events')}
            >
              View All Events →
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY */}
        <div className="ad-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--ad-text-primary)' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivities.map(activity => (
              <div key={activity.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                  {activity.type === 'child' ? '👶' : activity.type === 'payment' ? '💰' : activity.type === 'system' ? '⚙️' : '📝'}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500, color: '#334155' }}>{activity.text}</p>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{activity.time}</span>
                </div>
              </div>
            ))}
            <button
              style={{ background: 'none', border: 'none', color: 'var(--ad-accent)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', textAlign: 'left' }}
              onClick={() => navigate('/admin/notifications')}
            >
              View All Activity →
            </button>
          </div>
        </div>

      </div>
    </div >
  );
};

export default AdminDashboard;
