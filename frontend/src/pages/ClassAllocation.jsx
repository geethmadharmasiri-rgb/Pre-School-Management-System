import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClassAllocation.css";

const MAX_PRESCHOOL_CAPACITY = 150;

// Demo data
const initialClasses = [
  { id: "A", name: "Class A", capacity: 50, teacherId: "EMP001", childIds: [] },
  { id: "B", name: "Class B", capacity: 50, teacherId: "EMP002", childIds: [] },
  { id: "C", name: "Class C", capacity: 50, teacherId: "EMP003", childIds: [] },
];

const initialTeachers = [
  { id: "EMP001", name: "Ms. Clara Perera" },
  { id: "EMP002", name: "Mr. Erasha" },
  { id: "EMP003", name: "Ms. Sonali Perera" },
];

const initialChildren = [
  { id: "CH-001", name: "Shanaya Perera", age: 4, dateOfBirth: "20/05/2020" },
  { id: "CH-002", name: "Nethmi Silva", age: 5, dateOfBirth: "15/03/2019" },
  { id: "CH-003", name: "Malki Perera", age: 4, dateOfBirth: "10/06/2020" },
  { id: "CH-004", name: "Dineth Jayasinghe", age: 5, dateOfBirth: "22/04/2019" },
  { id: "CH-005", name: "Oshini Dharmasiri", age: 4, dateOfBirth: "18/07/2020" },
  { id: "CH-006", name: "Arjun Kumar", age: 5, dateOfBirth: "05/02/2019" },
  { id: "CH-007", name: "Isuru Mendis", age: 4, dateOfBirth: "12/08/2020" },
];

export default function ClassAllocation() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(initialClasses);
  const [teachers] = useState(initialTeachers);
  const [children] = useState(initialChildren);

  const [selectedClassId, setSelectedClassId] = useState("A");
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const selectedTeacher = useMemo(() => {
    if (!selectedClass) return null;
    return teachers.find((t) => t.id === selectedClass.teacherId);
  }, [selectedClass, teachers]);

  const totalAssigned = useMemo(
    () => classes.reduce((sum, c) => sum + c.childIds.length, 0),
    [classes]
  );

  const preschoolPercent = useMemo(() => {
    const cap = Math.max(1, MAX_PRESCHOOL_CAPACITY);
    return Math.min(100, Math.round((totalAssigned / cap) * 100));
  }, [totalAssigned]);

  const classPercent = useMemo(() => {
    if (!selectedClass) return 0;
    const cap = Math.max(1, Number(selectedClass.capacity || 0));
    return Math.min(100, Math.round((selectedClass.childIds.length / cap) * 100));
  }, [selectedClass]);

  // Children not already assigned to another class (or keep if already in this class)
  const availableChildren = useMemo(() => {
    const q = search.trim().toLowerCase();

    // map childId -> classId
    const owner = new Map();
    classes.forEach((c) => c.childIds.forEach((id) => owner.set(id, c.id)));

    return children
      .filter((ch) => {
        const inThisClass = owner.get(ch.id) === selectedClassId;
        const unassigned = !owner.has(ch.id);
        return inThisClass || unassigned;
      })
      .filter((ch) => {
        if (!q) return true;
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.id.toLowerCase().includes(q) ||
          String(ch.age).includes(q)
        );
      });
  }, [children, classes, selectedClassId, search]);

  const toggleChild = (childId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;

        const exists = c.childIds.includes(childId);
        if (exists) {
          return { ...c, childIds: c.childIds.filter((id) => id !== childId) };
        }

        // capacity guard
        if (c.childIds.length >= Number(c.capacity || 0)) return c;

        return { ...c, childIds: [...c.childIds, childId] };
      })
    );
  };

  const updateCapacity = (value) => {
    const cap = Math.max(0, Number(value || 0));
    setClasses((prev) =>
      prev.map((c) => (c.id === selectedClassId ? { ...c, capacity: cap } : c))
    );
  };

  const updateClassName = (value) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === selectedClassId ? { ...c, name: value } : c))
    );
  };

  const updateTeacher = (teacherId) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === selectedClassId ? { ...c, teacherId } : c))
    );
  };

  const handleSave = () => {
    console.log("SAVE ALLOCATIONS:", classes);
    alert("Class allocations saved ✅");
  };

  const handleReset = () => {
    if (!window.confirm("Reset all allocations?")) return;
    setClasses(initialClasses);
    setSelectedClassId("A");
    setSearch("");
  };

  return (
    <div className="ad-container">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <h2 className="ad-logo">ILA KIDS CAMPUS</h2>

        <nav className="ad-menu">
          <button className="ad-menu-item" onClick={() => navigate("/admin")}>
            <span className="icon">{Icons.dashboard()}</span>
            Dashboard
          </button>

          <button className="ad-menu-item" onClick={() => navigate("/admin/children")}>
            <span className="icon">{Icons.child()}</span>
            Child Management
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.parents()}</span>
            Parent Management
          </button>

          <button className="ad-menu-item" onClick={() => navigate("/admin/teachers")}>
            <span className="icon">{Icons.teacher()}</span>
            Teacher Management
          </button>

          <button className="ad-menu-item active">
            <span className="icon">{Icons.class()}</span>
            Class Allocation
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.attendance()}</span>
            Attendance
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.payment()}</span>
            Payments
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.reports()}</span>
            Reports
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.bell()}</span>
            Notifications
          </button>

          <button className="ad-menu-item">
            <span className="icon">{Icons.events()}</span>
            Events
          </button>
        </nav>

        <button className="ad-logout" onClick={handleLogout}>
          <span className="icon">{Icons.logout()}</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="ad-main">
        <header className="ad-header">
          <h1>Class Allocation</h1>
          <div className="notification">{Icons.bell()}</div>
        </header>

        {/* CLASS SELECTOR SECTION */}
        <section className="ca-selector-section">
          <h2 className="ca-section-title">Select Class</h2>
          <div className="ca-class-buttons">
            {classes.map((c) => {
              const pct = Number(c.capacity || 0)
                ? Math.min(100, Math.round((c.childIds.length / Number(c.capacity)) * 100))
                : 0;
              const active = c.id === selectedClassId;

              return (
                <button
                  key={c.id}
                  className={`ca-class-btn ${active ? "active" : ""}`}
                  onClick={() => setSelectedClassId(c.id)}
                >
                  <div className="ca-btn-name">{c.name}</div>
                  <div className="ca-btn-info">
                    {c.childIds.length}/{c.capacity}
                  </div>
                  <div className="ca-btn-bar">
                    <div className="ca-btn-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* MAIN ALLOCATION GRID */}
        <section className="ca-main-grid">
          {/* LEFT: CLASS SETTINGS */}
          <div className="ca-settings-card">
            <div className="ca-card-header">
              <h2>Class Settings</h2>
              <p>Configure class details and assign teacher</p>
            </div>

            <div className="ca-settings-content">
              {/* Class Name */}
              <div className="ca-field-group">
                <label>Class Name</label>
                <input
                  value={selectedClass?.name || ""}
                  onChange={(e) => updateClassName(e.target.value)}
                  placeholder="Enter class name"
                />
              </div>

              {/* Capacity */}
              <div className="ca-field-group">
                <label>Class Capacity</label>
                <input
                  type="number"
                  value={selectedClass?.capacity ?? 0}
                  onChange={(e) => updateCapacity(e.target.value)}
                  placeholder="Enter capacity"
                  min={0}
                />
              </div>

              {/* Teacher */}
              <div className="ca-field-group">
                <label>Primary Teacher</label>
                <select
                  value={selectedClass?.teacherId || ""}
                  onChange={(e) => updateTeacher(e.target.value)}
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Info */}
              {selectedTeacher && (
                <div className="ca-teacher-info">
                  <div className="ca-teacher-label">Assigned Teacher:</div>
                  <div className="ca-teacher-name">{selectedTeacher.name}</div>
                  <div className="ca-teacher-id">{selectedTeacher.id}</div>
                </div>
              )}

              {/* Fill Percentage */}
              <div className="ca-fill-indicator">
                <div className="ca-fill-label">Capacity Used</div>
                <div className="ca-fill-value">{classPercent}%</div>
                <div className="ca-fill-bar">
                  <div className="ca-fill-bar-fill" style={{ width: `${classPercent}%` }} />
                </div>
              </div>

              {/* Save/Reset Buttons */}
              <div className="ca-button-group">
                <button className="ca-btn-save" onClick={handleSave}>
                  💾 Save Allocations
                </button>
                <button className="ca-btn-reset" onClick={handleReset}>
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: CHILDREN LIST */}
          <div className="ca-children-card">
            <div className="ca-card-header">
              <h2>Assign Children to {selectedClass?.name}</h2>
              <p>Search and select children to allocate to this class</p>
            </div>

            <div className="ca-search-wrapper">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search by name, ID, or age..."
                className="ca-search-input"
              />
            </div>

            {/* Children List with Scroll */}
            <div className="ca-children-list">
              {availableChildren.length > 0 ? (
                availableChildren.map((ch) => {
                  const checked = selectedClass?.childIds.includes(ch.id);
                  const isFull =
                    (selectedClass?.childIds.length || 0) >= Number(selectedClass?.capacity || 0);
                  const disabled = !checked && isFull;

                  return (
                    <div key={ch.id} className="ca-child-item">
                      <div className="ca-child-checkbox">
                        <input
                          type="checkbox"
                          checked={!!checked}
                          disabled={disabled}
                          onChange={() => toggleChild(ch.id)}
                        />
                      </div>
                      <div className="ca-child-details">
                        <div className="ca-child-name">{ch.name}</div>
                        <div className="ca-child-meta">
                          ID: {ch.id} | Age: {ch.age} | DOB: {ch.dateOfBirth}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="ca-empty-message">No children found matching your search</div>
              )}
            </div>

            {/* Selected Count */}
            <div className="ca-selected-count">
              Selected: {selectedClass?.childIds.length || 0} / {selectedClass?.capacity || 0}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================== ICONS ================== */

const Icons = {
  dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  child: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0 -6 0"></path>
      <path d="M12 2c-3.314 0 -6 3.134 -6 7v2c0 4.418 2 7 6 7s6 -2.582 6 -7v-2c0 -3.866 -2.686 -7 -6 -7z"></path>
      <path d="M5 20h14"></path>
    </svg>
  ),
  parents: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0 -4 -4H5a4 4 0 0 0 -4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0 -3 -3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  teacher: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c-3.314 0 -6 3.134 -6 7c0 2 1 3 3 4v2h12v-2c2 -1 3 -2 3 -4c0 -3.866 -2.686 -7 -6 -7z"></path>
      <path d="M4 19h16"></path>
      <path d="M6 19v2"></path>
      <path d="M18 19v2"></path>
    </svg>
  ),
  class: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <path d="M3 10h18"></path>
      <path d="M8 5v10"></path>
      <path d="M16 5v10"></path>
    </svg>
  ),
  attendance: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12a9 9 0 1 1 0 -18 9 9 0 0 1 0 18z"></path>
    </svg>
  ),
  payment: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <path d="M1 10h22"></path>
    </svg>
  ),
  reports: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="12" y1="13" x2="12" y2="17"></line>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  ),
  bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7 -3 9 -3 9h18s -3 -2 -3 -9"></path>
      <path d="M13.73 21a2 2 0 0 1 -3.46 0"></path>
    </svg>
  ),
  events: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <path d="M16 2v4"></path>
      <path d="M8 2v4"></path>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1 -2 -2V5a2 2 0 0 1 2 -2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
};

