import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Icons } from "../components/Icons";

export default function TeacherClassChildren() {
    const { selectedYearId } = useOutletContext();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClassChildren = async () => {
            if (!selectedYearId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/children?yearId=${selectedYearId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setChildren(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClassChildren();
    }, [selectedYearId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>My Class Children</h1>
                    <p className="ad-header-subtitle">View details of all children in your assigned class</p>
                </div>
            </header>

            <div className="table-container" style={{ marginTop: '24px' }}>
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Child Name</th>
                            <th>Age</th>
                            <th>Parent Details</th>
                            <th>Contact</th>
                            <th>Address</th>
                            <th>Medical Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {children.map((child) => (
                            <tr key={child.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {child.profile_picture ? (
                                                <img src={`http://localhost:5000/${child.profile_picture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '18px' }}>{child.gender === 'Female' ? '👧' : '👦'}</span>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{child.first_name} {child.last_name}</span>
                                    </div>
                                </td>
                                <td>{new Date().getFullYear() - new Date(child.dob).getFullYear()}</td>
                                <td>
                                    <div style={{ fontSize: '14px' }}>{child.parentName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{child.parentEmail}</div>
                                </td>
                                <td>{child.contactNumber}</td>
                                <td>{child.parentAddress || "N/A"}</td>
                                <td>{child.medical_conditions || "None"}</td>
                            </tr>
                        ))}
                        {children.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No children found in your class.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
