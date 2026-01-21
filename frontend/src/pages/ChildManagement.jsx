import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChildManagement.css";

const ChildManagement = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    className: "",
    dateOfBirth: "",
    gender: "",
    parentName: "",
    contactNumber: "",
    email: "",
  });

  // TEMP data (later connect backend)
  const [children, setChildren] = useState([
    { id: 1, name: "Shanaya Perera", age: 4, className: "Sunny Meadows", dateOfBirth: "20/05/2020", gender: "Female", parentName: "Priya Perera", contactNumber: "+94 77 123 4567", email: "priya@example.com" },
    { id: 2, name: "Nethmi Silva", age: 5, className: "Rainbow Kids", dateOfBirth: "15/03/2019", gender: "Female", parentName: "Ravi Silva", contactNumber: "+94 77 234 5678", email: "ravi@example.com" },
  ]);

  const filteredChildren = children.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAddChild = () => {
    navigate("/admin/children/new");
  };

  const handleEditChild = (child) => {
    setEditingId(child.id);
    setFormData(child);
    setShowForm(true);
  };

  const handleDeleteChild = (id) => {
    setChildren(children.filter((c) => c.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setChildren(
        children.map((c) =>
          c.id === editingId ? { ...formData, id: editingId } : c
        )
      );
    } else {
      setChildren([...children, { ...formData, id: Date.now() }]);
    }
    setShowForm(false);
    setFormData({ name: "", age: "", className: "", dateOfBirth: "", gender: "", parentName: "", contactNumber: "", email: "" });
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

          <button className="ad-menu-item active">
            <span className="icon">{Icons.child}</span>
            Child Management
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.parents}</span>
            Parent Management
          </button>

          <button className="ad-menu-item" onClick={() => navigate("/admin/teachers")}>
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
          <h1>Child Management</h1>
          <div className="notification">{Icons.bell}</div>
        </header>

        {/* SEARCH AND ADD SECTION */}
        <section className="cm-header-actions-section">
          <div className="cm-search-container">
            <input
              type="text"
              placeholder="Search child..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cm-search-input"
            />
            <p className="cm-search-subtitle">Search by child name to quickly find and manage their information</p>
          </div>
          <button className="cm-add-btn" onClick={handleAddChild}>
            + Add Child
          </button>
        </section>

        {/* CHILD TABLE */}
        <section className="cm-table-card">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Class</th>
                <th>Parent Name</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChildren.map((child) => (
                <tr key={child.id}>
                  <td>{child.name}</td>
                  <td>{child.age}</td>
                  <td>{child.className}</td>
                  <td>{child.parentName}</td>
                  <td>{child.contactNumber}</td>
                  <td className="cm-actions">
                    <button
                      className="edit"
                      onClick={() => handleEditChild(child)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete"
                      onClick={() => handleDeleteChild(child.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredChildren.length === 0 && (
                <tr>
                  <td colSpan="6" className="cm-empty">
                    No children found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* ADD/EDIT CHILD MODAL */}
      {showForm && (
        <div className="cm-modal-overlay">
          <div className="cm-modal">
            {/* MODAL HEADER */}
            <div className="cm-modal-header">
              <h2>{editingId ? "Edit Child" : "Add Child"}</h2>
              <button className="cm-close" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            {/* FORM */}
            <form className="cm-form" onSubmit={handleSubmit}>
              <div className="cm-form-group">
                <label>Child Name *</label>
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
                  <label>Age *</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="cm-form-group">
                  <label>Date of Birth</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="cm-form-row">
                <div className="cm-form-group">
                  <label>Gender</label>
                  <input
                    type="text"
                    placeholder="Male / Female"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  />
                </div>

                <div className="cm-form-group">
                  <label>Class *</label>
                  <input
                    type="text"
                    placeholder="Class name"
                    value={formData.className}
                    onChange={(e) =>
                      setFormData({ ...formData, className: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="cm-form-group">
                <label>Parent Name</label>
                <input
                  type="text"
                  placeholder="Enter parent/guardian name"
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    placeholder="+94 77 xxx xxxx"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                  />
                </div>

                <div className="cm-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="cm-form-actions">
                <button
                  type="button"
                  className="back"
                  onClick={() => setShowForm(false)}
                >
                  Back
                </button>

                <button type="submit" className="submit">
                  {editingId ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

export default ChildManagement;
