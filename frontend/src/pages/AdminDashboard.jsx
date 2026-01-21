import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="ad-container">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <h2 className="ad-logo">ILA KIDS CAMPUS</h2>

        <nav className="ad-menu">
          <button className="ad-menu-item active">
            <span className="icon">{Icons.dashboard}</span>
            Dashboard
          </button>

          <button
            className="ad-menu-item"
            onClick={() => navigate("/admin/children")}
          >
            <span className="icon">{Icons.child}</span>
            Child Management
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.parents}</span>
            Parent Management
          </button>

          <button
            className="ad-menu-item"
            onClick={() => navigate("/admin/teachers")}
          >
            <span className="icon">{Icons.teacher}</span>
            Teacher Management
          </button>


          <button
            className="ad-menu-item"
            onClick={() => navigate("/admin/classes")}
          >
            <span className="icon">{Icons.class}</span>
            Class Allocation
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.attendance}</span>
            Attendance
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.payment}</span>
            Payments
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.reports}</span>
            Reports
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.bell}</span>
            Notifications
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.events}</span>
            Events
          </button>
        </nav>

        <button className="ad-logout" onClick={handleLogout}>
          <span className="icon">{Icons.logout}</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="ad-main">
        <header className="ad-header">
          <h1>Admin Dashboard</h1>
          <div className="notification">{Icons.bell}</div>
        </header>

        {/* Stats Cards */}
        <section className="ad-cards">
          <div className="ad-card">
            <span className="icon big">{Icons.child}</span>
            <h3>Total Children</h3>
            <p>150</p>
          </div>

          <div className="ad-card">
            <span className="icon big">{Icons.teacher}</span>
            <h3>Total Teachers</h3>
            <p>15</p>
          </div>

          <div className="ad-card">
            <span className="icon big">{Icons.payment}</span>
            <h3>Outstanding Payments</h3>
            <p>Rs. 150,000</p>
          </div>

          <div className="ad-card">
            <span className="icon big">{Icons.events}</span>
            <h3>Events</h3>
            <p>5</p>
          </div>
        </section>

        {/* Activities */}
        <section className="ad-activity">
          <h2>Recent Activities</h2>
          <ul>
            <li>✔ New child registered</li>
            <li>✔ Parent payment received</li>
            <li>✔ Attendance updated</li>
            <li>✔ Event updated</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

/* ---------------- ICONS ---------------- */

const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24">
      <path d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z" />
    </svg>
  ),
  child: (
    <svg viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    </svg>
  ),
  parents: (
    <svg viewBox="0 0 24 24">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M8 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12z" />
      <path d="M16 13c-3.3 0-6 1.8-6 4v3h12v-3c0-2.2-2.7-4-6-4z" />
    </svg>
  ),
  teacher: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3L2 9l10 6 10-6-10-6z" />
      <path d="M4 13v4l8 4 8-4v-4l-8 4-8-4z" />
    </svg>
  ),
  class: (
    <svg viewBox="0 0 24 24">
      <path d="M3 4h18v2H3zM3 8h18v12H3z" />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 24 24">
      <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2z" />
      <path d="M6 8h12v12H6z" />
    </svg>
  ),
  payment: (
    <svg viewBox="0 0 24 24">
      <path d="M3 5h18v14H3z" />
      <path d="M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24">
      <path d="M3 3h18v18H3z" />
      <path d="M7 13h2v4H7zm4-6h2v10h-2zm4 3h2v7h-2z" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24">
      <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2z" />
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24">
      <path d="M10 17l4-4-4-4v3H3v2h7z" />
      <path d="M14 3h7v18h-7v-2h5V5h-5z" />
    </svg>
  ),
};

export default AdminDashboard;
