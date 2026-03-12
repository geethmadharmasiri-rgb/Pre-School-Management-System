import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

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
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.empId.toLowerCase().includes(search.toLowerCase())
  );

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
    } else {
      setTeachers([...teachers, { ...formData, id: Date.now() }]);
    }
    handleCloseForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <header className="ad-header">
        <div>
          <h1>Teacher Management</h1>
          <p className="ad-header-subtitle">Manage staff details and class assignments</p>
        </div>
        <div className="notification">{Icons.bell}</div>
      </header>

      {/* SEARCH AND ADD SECTION */}
      <div className="filters-section">
        <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ width: '20px', color: '#94a3b8' }}>{Icons.search}</span>
          <input
            type="text"
            placeholder="Search teacher by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-input"
            style={{ border: 'none', background: 'transparent', padding: '0' }}
          />
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/teachers/new")}>
          {Icons.plus} Add Teacher
        </button>
      </div>

      {/* TEACHER TABLE */}
      <div className="table-container">
        <table className="ad-table">
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
                <td style={{ fontWeight: 500 }}>{teacher.name}</td>
                <td>{teacher.empId}</td>
                <td>{teacher.assignedClass}</td>
                <td>{teacher.email}</td>
                <td>{teacher.contact}</td>
                <td>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditTeacher(teacher)}
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(teacher.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No teachers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT TEACHER MODAL */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="ad-form-card" style={{ width: '100%', maxWidth: '600px', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{editingId ? "Edit Teacher" : "Add Teacher"}</h2>
              <button onClick={handleCloseForm} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ad-form-group">
                <label>Teacher Name *</label>
                <input
                  type="text"
                  className="ad-input"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    className="ad-input"
                    placeholder="e.g., EMP-001"
                    value={formData.empId}
                    onChange={(e) =>
                      setFormData({ ...formData, empId: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="ad-form-group">
                  <label>Assigned Class</label>
                  <input
                    type="text"
                    className="ad-input"
                    placeholder="e.g., Class A"
                    value={formData.assignedClass}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedClass: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="ad-form-row">
                <div className="ad-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="ad-input"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="ad-form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    className="ad-input"
                    placeholder="Enter contact number"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="ad-form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Teacher" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
