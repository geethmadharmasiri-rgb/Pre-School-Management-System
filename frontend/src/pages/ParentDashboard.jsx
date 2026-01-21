import "./ParentDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChild,
  FaBell,
  FaCalendarAlt,
  FaClipboardCheck,
  FaBookOpen,
  FaMoneyBillWave,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";

const ParentDashboard = () => {
  const navigate = useNavigate();

  const [parent, setParent] = useState(null);
  const [loadingParent, setLoadingParent] = useState(true);
  const [parentError, setParentError] = useState("");

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // ✅ fallback (if DB call slow)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const fallbackName = storedUser?.name || "Parent";

  const upcomingEvents = [
    { date: "Jan 18", title: "Parents Meeting - 2.00 PM" },
    { date: "Jan 22", title: "Art Day 🎨" },
    { date: "Jan 28", title: "Monthly Payment Due" },
  ];

  const children = [
    { id: 1, name: "Dinu Perera", status: "ENROLLED" },
    { id: 2, name: "Saraa", status: "PENDING" },
  ];

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ✅ Load parent profile from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingParent(true);
    setParentError("");

    fetch("http://localhost:5000/api/parents/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();

        // ✅ If token invalid / expired, force logout
        if (res.status === 401) {
          handleLogout();
          throw new Error("Session expired. Please login again.");
        }

        if (!res.ok) throw new Error(data.message || "Failed to load parent profile");
        return data;
      })
      .then((data) => {
        setParent(data);
      })
      .catch((err) => {
        setParentError(err.message || "Connection error");
      })
      .finally(() => setLoadingParent(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ✅ Use DB name first, fallback to localStorage name
  const displayName = parent?.name || fallbackName;

  return (
    <div className="parent-dashboard">
      {/* Top bar actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button className="btn" onClick={handleLogout} type="button">
          <FaSignOutAlt style={{ marginRight: 8 }} />
          Logout
        </button>
      </div>

      {parentError && (
        <div style={{ margin: "10px 0", color: "red", fontWeight: 600 }}>
          {parentError}
        </div>
      )}

      <div className="top-row">
        <div className="welcome-card">
          <div>
            <h2>{loadingParent ? "Loading..." : `Welcome back, ${displayName} 👋`}</h2>
            <p>
              Manage your children’s profiles and stay updated with school activities in one place.
            </p>

            {!loadingParent && parent && (
              <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                {parent.email} {parent.phone ? `• ${parent.phone}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="quick-widgets">
          <div
            className="widget-card clickable"
            onClick={() => setUnreadCount(0)}
          >
            <div className="widget-title">
              <FaBell /> Notifications
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </div>
            <p className="widget-sub">Tap to view latest updates.</p>
          </div>

          <div className="widget-card">
            <div className="widget-title">
              <FaCalendarAlt /> Upcoming
            </div>

            <div className="events-list">
              {upcomingEvents.map((e, idx) => (
                <div className="event-item" key={idx}>
                  <span className="event-date">{e.date}</span>
                  <span className="event-title">{e.title}</span>
                </div>
              ))}
            </div>

            <button className="small-btn" onClick={() => navigate("/calendar")} type="button">
              Open Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="children-header">
        <h3>My Children</h3>
        <span className="archive-link" onClick={() => navigate("/archive")}>
          View Archive
        </span>
      </div>

      <div className="children-grid">
        {children.map((child) => (
          <div className="child-card" key={child.id}>
            <span className={`status ${child.status === "ENROLLED" ? "enrolled" : "pending"}`}>
              {child.status}
            </span>

            <div className="avatar">
              <FaChild />
            </div>

            <h4>{child.name}</h4>

            {child.status === "ENROLLED" ? (
              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => navigate(`/attendance/${child.id}`)}
                  type="button"
                >
                  <FaClipboardCheck /> Attendance
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate(`/homework/${child.id}`)}
                  type="button"
                >
                  <FaBookOpen /> Homework
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate(`/payments/${child.id}`)}
                  type="button"
                >
                  <FaMoneyBillWave /> Payments
                </button>
              </div>
            ) : (
              <button
                className="outline-btn"
                onClick={() => alert("Your request is still pending approval.")}
                type="button"
              >
                Check Status
              </button>
            )}

            <button
              className="primary-btn"
              onClick={() => navigate(`/child-profile/${child.id}`)}
              type="button"
              disabled={child.status !== "ENROLLED"}
              title={child.status !== "ENROLLED" ? "Wait until admin approves" : "Open child profile"}
            >
              View Profile
            </button>
          </div>
        ))}

        <div
          className="child-card add-card"
          onClick={() => setShowEnrollModal(true)}
          role="button"
          tabIndex={0}
        >
          <div className="plus">+</div>
          <p>Enroll Another Child</p>
        </div>
      </div>

      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enroll a Child</h3>
              <button className="icon-btn" onClick={() => setShowEnrollModal(false)} type="button">
                <FaTimes />
              </button>
            </div>

            <p className="modal-sub">
              If your child is already in the system, enter the Child ID to link your profile.
            </p>

            <label className="modal-label">Child ID</label>
            <input className="modal-input" placeholder="e.g. ILA-CH-1023" />

            <label className="modal-label">Child Name (Optional)</label>
            <input className="modal-input" placeholder="Enter child name" />

            <button
              className="primary-btn modal-submit"
              onClick={() => {
                alert("Request submitted! Admin will review your request.");
                setShowEnrollModal(false);
              }}
              type="button"
            >
              Submit Enrollment Request
            </button>
          </div>
        </div>
      )}

      <footer>© 2026 ILA Kids Campus Management System</footer>
    </div>
  );
};

export default ParentDashboard;
