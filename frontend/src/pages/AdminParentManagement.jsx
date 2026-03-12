import React, { useState } from "react";
import { Icons } from "../components/Icons";

const AdminParentManagement = () => {
    const [search, setSearch] = useState("");

    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingParent, setEditingParent] = useState(null);

    const fetchParents = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/parents", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setParents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchParents();
    }, []);


    const filteredParents = parents.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nic.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this parent record? This will also remove their user account.")) {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/admin/parents/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchParents();
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/parents/${editingParent.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editingParent)
            });

            if (res.ok) {
                alert("Parent profile updated successfully!");
                setShowEditModal(false);
                fetchParents();
            } else {
                alert("Failed to update profile.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating profile.");
        }
    };

    const handleAccessAction = async (parentId, childId, status) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admin/access-request", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ parentId, childId, status })
            });

            if (res.ok) {
                // Refresh list
                fetchParents();
                alert(`Access request ${status}!`);
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating status.");
        }
    };

    const handleEdit = (parent) => {
        setEditingParent({ ...parent });
        setShowEditModal(true);
    };

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Parent Management</h1>
                    <p className="ad-header-subtitle">View and manage parent/guardian profiles</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            <div className="filters-section">
                <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ width: '20px', color: '#94a3b8' }}>{Icons.search}</span>
                    <input
                        type="text"
                        placeholder="Search by name or NIC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ad-input"
                        style={{ border: 'none', background: 'transparent', padding: '0' }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Parent Name</th>
                            <th>Role</th>
                            <th>NIC</th>
                            <th>Contact</th>
                            <th>Children</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParents.map(parent => (
                            <tr key={parent.id}>
                                <td style={{ fontWeight: 500 }}>{parent.name}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                        backgroundColor: parent.type === 'Mother' ? '#fce7f3' : parent.type === 'Father' ? '#dbeafe' : '#fef3c7',
                                        color: parent.type === 'Mother' ? '#be185d' : parent.type === 'Father' ? '#1e40af' : '#92400e'
                                    }}>
                                        {parent.type}
                                    </span>
                                </td>
                                <td>{parent.nic}</td>
                                <td>{parent.phone}</td>
                                <td>
                                    {parent.childrenDetails ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {parent.childrenDetails.split(';;').map((childStr, idx) => {
                                                const parts = childStr.split(':');
                                                // Handle potential legacy format or data issues
                                                if (parts.length < 3) return <span key={idx}>{childStr}</span>;

                                                const [childId, childName, status] = parts;
                                                const isPending = status === 'pending';

                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', background: isPending ? '#fff7ed' : 'transparent', padding: '2px 4px', borderRadius: '4px' }}>
                                                        <span>{childName}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{
                                                                fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '8px',
                                                                backgroundColor: status === 'approved' ? '#dcfce7' : status === 'rejected' ? '#fee2e2' : '#ffedd5',
                                                                color: status === 'approved' ? '#166534' : status === 'rejected' ? '#991b1b' : '#9a3412'
                                                            }}>
                                                                {status}
                                                            </span>
                                                            {isPending && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAccessAction(parent.id, childId, 'approved')}
                                                                        title="Approve"
                                                                        style={{ border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAccessAction(parent.id, childId, 'rejected')}
                                                                        title="Reject"
                                                                        style={{ border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>N/A</span>
                                    )}
                                </td>

                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-secondary btn-small" onClick={() => handleEdit(parent)}>Edit Profile</button>
                                        <button className="action-btn delete" onClick={() => handleDelete(parent.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredParents.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No parents found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* EDIT PARENT MODAL */}
            {showEditModal && editingParent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Edit Parent Profile</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="ad-form-group">
                                <label>Full Name</label>
                                <input
                                    className="ad-input"
                                    value={editingParent.name}
                                    onChange={e => setEditingParent({ ...editingParent, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Role (Relationship)</label>
                                <select
                                    className="ad-select"
                                    value={editingParent.type}
                                    onChange={e => setEditingParent({ ...editingParent, type: e.target.value })}
                                >
                                    <option value="Mother">Mother</option>
                                    <option value="Father">Father</option>
                                    <option value="Guardian">Guardian</option>
                                </select>
                            </div>
                            <div className="ad-form-group">
                                <label>NIC</label>
                                <input
                                    className="ad-input"
                                    value={editingParent.nic}
                                    onChange={e => setEditingParent({ ...editingParent, nic: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Contact Number</label>
                                <input
                                    className="ad-input"
                                    value={editingParent.phone}
                                    onChange={e => setEditingParent({ ...editingParent, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Email Address</label>
                                <input
                                    className="ad-input"
                                    value={editingParent.email}
                                    onChange={e => setEditingParent({ ...editingParent, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Occupation</label>
                                <input
                                    className="ad-input"
                                    value={editingParent.occupation || ''}
                                    onChange={e => setEditingParent({ ...editingParent, occupation: e.target.value })}
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Address</label>
                                <textarea
                                    className="ad-input"
                                    value={editingParent.address || ''}
                                    onChange={e => setEditingParent({ ...editingParent, address: e.target.value })}
                                    rows={2}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminParentManagement;
