import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";
import "./ClassAllocation.css";

export default function ClassAllocation() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("unassigned"); // 'unassigned', 'assigned', 'all'
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected Class Form State (for the left column)
  const [classForm, setClassForm] = useState({ name: "", capacity: 25, teacher_id: "" });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      // 1. Fetch Years first
      const resYears = await fetch("http://localhost:5000/api/admin/academic-years", { headers: { Authorization: `Bearer ${token}` } });
      const dataYears = await resYears.json();
      setYears(dataYears);

      // Determine active year to show initially
      let currentYearId = selectedYearId;
      if (!currentYearId && dataYears.length > 0) {
        const active = dataYears.find(y => y.is_active);
        currentYearId = active ? active.id : dataYears[0].id;
        setSelectedYearId(currentYearId);
      }

      // 2. Fetch other data based on selected year
      const [resCls, resTea, resChi] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/classes?yearId=${currentYearId || ''}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/admin/teachers", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/children", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [dataCls, dataTea, dataChi] = await Promise.all([resCls.json(), resTea.json(), resChi.json()]);

      // Enrich child data with class names
      const enrichedChi = dataChi.map(ch => {
        const cls = dataCls.find(c => c.id === ch.class_id);
        return { ...ch, className: cls ? cls.name : null };
      });

      setClasses(dataCls);
      setTeachers(dataTea);
      setChildren(enrichedChi);

      if (dataCls.length > 0) {
        // If we switched years and the previously selected class doesn't exist in new list, select first
        if (!selectedClassId || !dataCls.find(c => c.id === selectedClassId)) {
          setSelectedClassId(dataCls[0].id);
          setClassForm({ name: dataCls[0].name, capacity: dataCls[0].capacity, teacher_id: dataCls[0].teacher_id || "" });
        } else {
          // Refresh form data for currently selected class (in case of updates)
          const updated = dataCls.find(c => c.id === selectedClassId);
          if (updated) setClassForm({ name: updated.name, capacity: updated.capacity, teacher_id: updated.teacher_id || "" });
        }
      } else {
        setSelectedClassId(null); // No classes in this year
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId]); // Re-fetch when year changes

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleClassSelect = (cls) => {
    setSelectedClassId(cls.id);
    setClassForm({ name: cls.name, capacity: cls.capacity, teacher_id: cls.teacher_id || "" });
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/classes/${selectedClassId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: classForm.name,
          capacity: Number(classForm.capacity),
          teacherId: classForm.teacher_id || null,
          academicYearId: selectedYearId
        }),
      });
      if (res.ok) {
        alert("Class updated successfully!");
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedClass.name}? All children will be unassigned.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/classes/${selectedClassId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedClassId(null);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  // Allow removing a child from ANY class, not just the selected one
  const handleToggleChild = async (childId, targetClassId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/children/${childId}/assign-class`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: targetClassId }),
      });

      if (res.ok) {
        // Success - force refresh
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message || "Failed to update assignment"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Connectivity error while updating assignment");
    }
  };

  // Filter and Sort logic for right column
  const childList = children.filter(ch => {
    const matchesSearch = `${ch.first_name} ${ch.last_name} ${ch.id}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Use loose equality == to handle string vs number IDs
    if (filterType === 'unassigned') return !ch.class_id;
    // 'assigned' now shows both class members AND unassigned children for easy allocation
    if (filterType === 'assigned') return ch.class_id == selectedClassId || !ch.class_id;
    return true; // 'all'
  }).sort((a, b) => {
    // 1. Group by Class ID (Selection first, then others, then Unassigned at bottom for 'all')
    const aClass = a.class_id || Infinity;
    const bClass = b.class_id || Infinity;

    if (filterType === 'all') {
      // For 'all' view, group by class name alphabetically
      const aName = a.className || 'ZZZ';
      const bName = b.className || 'ZZZ';
      if (aName !== bName) return aName.localeCompare(bName);
    } else {
      // For specific views, keep selected class at top
      if (a.class_id == selectedClassId && b.class_id != selectedClassId) return -1;
      if (a.class_id != selectedClassId && b.class_id == selectedClassId) return 1;
    }

    // Secondary sort by name
    return a.first_name.localeCompare(b.first_name);
  });

  if (loading && !years.length) return <div className="loading">Loading...</div>;

  return (
    <div className="class-allocation">
      <header className="ad-header">
        <div>
          <h1>Class Allocation</h1>
          <p className="ad-header-subtitle">Assign children to classes and manage settings</p>
        </div>
        <div className="ca-top-controls">
          <div className="ca-year-selector">
            <span>Academic Year:</span>
            <select
              className="ad-select"
              style={{ border: 'none', background: 'transparent', padding: '0', fontWeight: 700, outline: 'none', cursor: 'pointer', color: '#0f172a' }}
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y.id} value={y.id}>
                  {y.year_name} {y.is_active ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={() => navigate('/admin/academic-years')}
            >
              Manage
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', width: '18px' }}>{Icons.plus}</span> Add New Class
          </button>
        </div>
      </header>

      {/* COMPACT CLASS SELECTOR BAR */}
      <div className="ca-class-grid">
        {classes.map(c => {
          const isActive = selectedClassId === c.id;
          const fillPercent = Math.min(100, Math.round((c.childIds.length / c.capacity) * 100));
          return (
            <div
              key={c.id}
              onClick={() => handleClassSelect(c)}
              className={`ca-class-card ${isActive ? 'active' : ''}`}
            >
              <div className="ca-class-name">{c.name}</div>
              <div className="ca-class-capacity">{c.childIds.length} / {c.capacity} Children</div>
              <div className="ca-progress-bg">
                <div className="ca-progress-fill" style={{ width: `${fillPercent}%` }}></div>
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <div style={{ padding: '20px', color: '#94a3b8', fontStyle: 'italic', gridColumn: '1 / -1' }}>
            No classes found in this academic year. Create one to get started.
          </div>
        )}
      </div>

      <div className="ca-panels-wrapper">
        {/* LEFT COLUMN: CLASS SETTINGS */}
        <div className="ca-settings-panel">
          <div className="ca-panel-header">
            <h3>Class Settings</h3>
            {selectedClass && (
              <button onClick={handleDeleteClass} className="ca-delete-btn" title="Delete Class">
                Delete Class
              </button>
            )}
          </div>

          {!selectedClass ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>Select a class to manage</div>
          ) : (
            <form onSubmit={handleUpdateClass}>
              <div className="ca-form-group">
                <label>Class Name</label>
                <input className="ad-input" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required />
              </div>
              <div className="ca-form-group">
                <label>Assigned Teacher</label>
                <select className="ad-select" value={classForm.teacher_id} onChange={e => setClassForm({ ...classForm, teacher_id: e.target.value })}>
                  <option value="">No Teacher Assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.emp_id})</option>
                  ))}
                </select>
              </div>
              <div className="ca-form-group">
                <label>Class Capacity</label>
                <input type="number" className="ad-input" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: Number(e.target.value) })} min="1" required />
              </div>

              <div className="ca-settings-occupancy">
                <div className="occ-title">Current Occupancy</div>
                <div className="occ-value">{Math.round((selectedClass.childIds.length / selectedClass.capacity) * 100)}%</div>
                <div className="occ-desc">{selectedClass.childIds.length} of {selectedClass.capacity} seats filled</div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>Save Changes</button>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: CHILD MANAGEMENT */}
        <div className="ca-enrollment-panel">
          <div className="ca-panel-header">
            <h3>Enrollment Management</h3>
          </div>

          <div className="ca-enrollment-controls">
            <div className="ca-search-input-wrapper">
              <span className="icon">{Icons.search}</span>
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <select className="ca-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="assigned">Members + Unassigned</option>
              <option value="unassigned">Only Unassigned</option>
              <option value="all">All Registered</option>
            </select>
          </div>

          <div className="ca-table-container">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Child Name</th>
                  <th>Current Class</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {childList.map((ch, index) => {
                  const isAssignedToThis = ch.class_id === selectedClassId;
                  
                  // GROUPING LOGIC for "All Children" view
                  const prevCh = index > 0 ? childList[index - 1] : null;
                  const showHeader = filterType === 'all' && (!prevCh || prevCh.className !== ch.className);

                  return (
                    <React.Fragment key={ch.id}>
                      {showHeader && (
                        <tr className="ca-group-header">
                          <td colSpan="4">
                            {ch.className ? `📁 ${ch.className}` : '⚪ Unassigned Children'}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>CH-{String(ch.id).padStart(3, '0')}</span></td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{ch.first_name} {ch.last_name}</td>
                        <td>
                          {ch.className ? (
                            <span className="ca-badge active">{ch.className}</span>
                          ) : (
                            <span className="ca-badge pending">Unassigned</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="ca-action-wrap">
                            {/* 1. REMOVE BUTTON */}
                            {ch.class_id && (
                              <button
                                onClick={() => handleToggleChild(ch.id, null)}
                                className="ca-action-btn delete"
                                title={`Remove from ${ch.className}`}
                              >
                                Remove
                              </button>
                            )}

                            {/* 2. ASSIGN/MOVE BUTTON */}
                            {(!ch.class_id || ch.class_id != selectedClassId) && (
                              <button
                                onClick={() => handleToggleChild(ch.id, selectedClassId)}
                                className={`ca-action-btn ${ch.class_id ? 'move' : 'assign'}`}
                                disabled={!selectedClass}
                              >
                                {ch.class_id ? `Move` : `Assign`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
                {childList.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '15px' }}>No matching children found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD CLASS MODAL */}
      {showAddModal && <AddClassModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchData(); }} teachers={teachers} currentYearId={selectedYearId} />}
    </div>
  );
}

function AddClassModal({ onClose, onSave, teachers, currentYearId }) {
  const [data, setData] = useState({ name: "", capacity: 25, teacherId: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          capacity: Number(data.capacity),
          teacherId: data.teacherId || null,
          academicYearId: currentYearId
        }),
      });
      if (res.ok) onSave();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="ca-modal-overlay">
      <div className="ca-modal-content">
        <h2>Create New Class</h2>
        <form onSubmit={submit}>
          <div className="ca-form-group">
            <label>Name</label>
            <input className="ad-input" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} required placeholder="e.g. Class C" />
          </div>
          <div className="ca-form-group">
            <label>Capacity</label>
            <input type="number" className="ad-input" value={data.capacity} onChange={e => setData({ ...data, capacity: e.target.value })} required />
          </div>
          <div className="ca-form-group">
            <label>Initial Teacher</label>
            <select className="ad-select" value={data.teacherId} onChange={e => setData({ ...data, teacherId: e.target.value })}>
              <option value="">Select Later</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="ca-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
