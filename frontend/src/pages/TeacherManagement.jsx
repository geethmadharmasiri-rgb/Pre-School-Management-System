import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherManagement.css";

export default function TeacherManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    assignedClass: "",
    email: "",
    contact: "",
  });

  // Demo data
  const [teachers, setTeachers] = useState([
    {
      id: 1,
      empId: "EMP001",
      name: "Ms. Clara Perera",
      assignedClass: "Class A",
      email: "clara.perera@email.com",
      contact: "+94 77 111 2222",
    },
    {
      id: 2,
      empId: "EMP002",
      name: "Mr. Erasha",
      assignedClass: "Class B",
      email: "erasha.ekene@email.com",
      contact: "+94 77 333 4444",
    },
    {
      id: 3,
      empId: "EMP003",
      name: "Ms. Sonali Perera",
      assignedClass: "Class C",
      email: "sonali.perera@email.com",
      contact: "+94 77 555 6666",
    },
  ]);

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.empId.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleEditTeacher = (teacher) => {
    setEditingId(teacher.id);
    setFormData(teacher);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      empId: "",
      assignedClass: "",
      email: "",
      contact: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setTeachers(
        teachers.map((t) =>
          t.id === editingId ? { ...formData, id: editingId } : t
        )
      );
    }
    handleCloseForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="ad-container">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <h2 className="ad-logo">ILA KIDS CAMPUS</h2>

        <nav className="ad-menu">
          <button className="ad-menu-item" onClick={() => navigate("/admin")}>
            <span className="icon">{Icons.dashboard}</span>
            Dashboard
          </button>

          <button className="ad-menu-item" onClick={() => navigate("/admin/children")}>
            <span className="icon">{Icons.child}</span>
            Child Management
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.parents}</span>
            Parent Management
          </button>

          <button className="ad-menu-item active">
            <span className="icon">{Icons.teacher}</span>
            Teacher Management
          </button>

          <button className="ad-menu-item">
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
          <h1>Teacher Management</h1>
          <div className="notification">{Icons.bell}</div>
        </header>

        {/* SEARCH AND ADD SECTION */}
        <section className="tm-header-section">
          <div className="tm-search-container">
            <input
              type="text"
              placeholder="Search teacher by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tm-search-input"
            />
            <p className="tm-search-subtitle">Search by teacher name or employee ID</p>
          </div>
          <button className="tm-add-btn" onClick={() => navigate("/admin/teachers/new")}>
            + Add Teacher
          </button>
        </section>

        {/* TEACHER TABLE CARD */}
        <section className="tm-table-section">
          <div className="tm-card">
            <div className="tm-cardHeader">
              <h2>Teachers List</h2>
              <p>View and manage all teachers</p>
            </div>

            <table className="tm-table">
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Employee ID</th>
                  <th>Assigned Class</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.name}</td>
                    <td>{teacher.empId}</td>
                    <td>{teacher.assignedClass}</td>
                    <td>{teacher.email}</td>
                    <td>{teacher.contact}</td>
                    <td className="tm-actions">
                      <button
                        className="tm-edit"
                        onClick={() => handleEditTeacher(teacher)}
                      >
                        Edit
                      </button>
                      <button
                        className="tm-delete"
                        onClick={() => handleDelete(teacher.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="tm-empty">
                      No teachers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* EDIT TEACHER MODAL */}
        {showForm && (
          <div className="cm-modal-overlay" onClick={handleCloseForm}>
            <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cm-modal-header">
                <h2>Edit Teacher</h2>
                <button className="cm-close" onClick={handleCloseForm}>
                  ✕
                </button>
              </div>

              <form className="cm-form" onSubmit={handleSubmit}>
                <div className="cm-form-group">
                  <label>Teacher Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="cm-form-row">
                  <div className="cm-form-group">
                    <label>Employee ID *</label>
                    <input
                      type="text"
                      placeholder="e.g., EMP-001"
                      value={formData.empId}
                      onChange={(e) =>
                        setFormData({ ...formData, empId: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="cm-form-group">
                    <label>Assigned Class *</label>
                    <input
                      type="text"
                      placeholder="e.g., Class A"
                      value={formData.assignedClass}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedClass: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="cm-form-row">
                  <div className="cm-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="cm-form-group">
                    <label>Contact Number *</label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="cm-form-actions">
                  <button type="button" className="back" onClick={handleCloseForm}>
                    Back
                  </button>
                  <button type="submit" className="submit">
                    Update Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================== ICONS ================== */

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
