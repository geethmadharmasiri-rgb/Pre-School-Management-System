
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

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

  // Updated: Allow removing a child from ANY class, not just the selected one
  const handleToggleChild = async (childId, targetClassId) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`DEBUG: Target class for child ${childId} is ${targetClassId}`);

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
    // Updated: 'assigned' now shows both class members AND unassigned children for easy allocation
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Academic Year:</span>
            <select
              className="ad-select"
              style={{ width: 'auto', padding: '8px 12px', fontWeight: 600 }}
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
              style={{ padding: '8px 12px', fontSize: '13px' }}
              onClick={() => navigate('/admin/academic-years')}
            >
              Manage
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            {Icons.plus} Add New Class
          </button>
        </div>
      </header>

      {/* COMPACT CLASS SELECTOR BAR */}
      <div style={{ display: 'flex', gap: '12px', margin: '24px 0', overflowX: 'auto', paddingBottom: '12px' }}>
        {classes.map(c => {
          const isActive = selectedClassId === c.id;
          const fillPercent = Math.min(100, Math.round((c.childIds.length / c.capacity) * 100));
          return (
            <div
              key={c.id}
              onClick={() => handleClassSelect(c)}
              className="ad-card"
              style={{
                minWidth: '200px', cursor: 'pointer',
                borderColor: isActive ? 'var(--ad-accent)' : 'transparent',
                backgroundColor: isActive ? '#f0fdfa' : 'white',
                padding: '16px'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '15px', color: isActive ? 'var(--ad-accent)' : 'inherit' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{c.childIds.length} / {c.capacity} Children</div>
              <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fillPercent}%`, background: isActive ? 'var(--ad-accent)' : '#94a3b8' }}></div>
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <div style={{ padding: '20px', color: '#94a3b8', fontStyle: 'italic' }}>No classes found in this academic year. Create one to get started.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT COLUMN: CLASS SETTINGS */}
        <div className="ad-card" style={{ position: 'sticky', top: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Class Settings</h3>
            {selectedClass && (
              <button onClick={handleDeleteClass} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Delete Class
              </button>
            )}
          </div>

          {!selectedClass ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Select a class to manage</div>
          ) : (
            <form onSubmit={handleUpdateClass}>
              <div className="ad-form-group">
                <label>Class Name</label>
                <input className="ad-input" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required />
              </div>
              <div className="ad-form-group">
                <label>Assigned Teacher</label>
                <select className="ad-select" value={classForm.teacher_id} onChange={e => setClassForm({ ...classForm, teacher_id: e.target.value })}>
                  <option value="">No Teacher Assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.emp_id})</option>
                  ))}
                </select>
              </div>
              <div className="ad-form-group">
                <label>Class Capacity</label>
                <input type="number" className="ad-input" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: Number(e.target.value) })} min="1" required />
              </div>

              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Current Occupancy</div>
                <div style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0' }}>{Math.round((selectedClass.childIds.length / selectedClass.capacity) * 100)}%</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedClass.childIds.length} of {selectedClass.capacity} seats filled</div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>Save Changes</button>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: CHILD MANAGEMENT */}
        <div className="ad-card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Enrollment Management</h3>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Show:</span>
              <select className="ad-select" style={{ width: 'auto', padding: '6px 12px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="assigned">Members + Unassigned</option>
                <option value="unassigned">Only Unassigned</option>
                <option value="all">All Registered (Class-wise)</option>
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by ID or Name..."
              className="ad-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', color: '#94a3b8' }}>{Icons.search}</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ad-table">
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
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <td colSpan="4" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {ch.className ? `📁 ${ch.className}` : '⚪ Unassigned Children'}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>CH-{String(ch.id).padStart(3, '0')}</span></td>
                        <td style={{ fontWeight: 500 }}>{ch.first_name} {ch.last_name}</td>
                        <td>
                          {ch.className ? (
                            <span className={`status-badge active`}>{ch.className}</span>
                          ) : (
                            <span className={`status-badge pending`}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {/* 1. REMOVE BUTTON (Shows if they have ANY class) */}
                            {ch.class_id && (
                              <button
                                onClick={() => handleToggleChild(ch.id, null)}
                                className="action-btn delete"
                                style={{ padding: '6px 12px', fontSize: '11px' }}
                              >
                                Remove from {ch.className}
                              </button>
                            )}

                            {/* 2. ASSIGN/MOVE BUTTON (Shows if not in currently selected class) */}
                            {(!ch.class_id || ch.class_id != selectedClassId) && (
                              <button
                                onClick={() => handleToggleChild(ch.id, selectedClassId)}
                                className="action-btn approve"
                                disabled={!selectedClass}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '11px',
                                  backgroundColor: ch.class_id ? '#6366f1' : 'var(--ad-accent)', // Use Indigo for 'Move' and Accent for 'Assign'
                                  opacity: !selectedClass ? 0.5 : 1 
                                }}
                              >
                                {ch.class_id ? `Move to ${selectedClass?.name || 'Class'}` : `Assign to ${selectedClass?.name || 'Class'}`}
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
                      No matching children found.
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
          academicYearId: currentYearId // Pass current year context
        }),
      });
      if (res.ok) onSave();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="ad-form-card" style={{ width: '400px' }}>
        <h2>Create New Class</h2>
        <form onSubmit={submit}>
          <div className="ad-form-group">
            <label>Name</label>
            <input className="ad-input" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} required placeholder="e.g. Class C" />
          </div>
          <div className="ad-form-group">
            <label>Capacity</label>
            <input type="number" className="ad-input" value={data.capacity} onChange={e => setData({ ...data, capacity: e.target.value })} required />
          </div>
          <div className="ad-form-group">
            <label>Initial Teacher</label>
            <select className="ad-select" value={data.teacherId} onChange={e => setData({ ...data, teacherId: e.target.value })}>
              <option value="">Select Later</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="ad-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
