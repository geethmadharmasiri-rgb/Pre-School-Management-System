import React, { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

export default function TeacherMealPlanning() {
    const [weekPlan, setWeekPlan] = useState({
        Monday: { lunch: "Not Set", snack: "Not Set", icon: "🍛" },
        Tuesday: { lunch: "Not Set", snack: "Not Set", icon: "🍝" },
        Wednesday: { lunch: "Not Set", snack: "Not Set", icon: "🍳" },
        Thursday: { lunch: "Not Set", snack: "Not Set", icon: "🥪" },
        Friday: { lunch: "Not Set", snack: "Not Set", icon: "🍲" },
        Saturday: { lunch: "No School", snack: "No School", icon: "🏠" },
        Sunday: { lunch: "No School", snack: "No School", icon: "🏠" }
    });

    const [editingDay, setEditingDay] = useState(null);
    const [tempMeal, setTempMeal] = useState({ lunch: "", snack: "" });

    useEffect(() => {
        fetchMealPlans();
    }, []);

    const fetchMealPlans = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/meal-plans");
            const data = await res.json();

            if (data && data.length > 0) {
                const newPlan = { ...weekPlan };
                data.forEach(item => {
                    if (newPlan[item.day_of_week]) {
                        if (item.meal_type === 'Lunch') newPlan[item.day_of_week].lunch = item.menu;
                        if (item.meal_type === 'Snack') newPlan[item.day_of_week].snack = item.menu;
                    }
                });
                setWeekPlan(newPlan);
            }
        } catch (err) {
            console.error("Fetch meal plans error:", err);
        }
    };

    const handleEdit = (day) => {
        setEditingDay(day);
        setTempMeal({ lunch: weekPlan[day].lunch, snack: weekPlan[day].snack });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/meal-plans", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    dayPlan: {
                        day: editingDay,
                        lunch: tempMeal.lunch,
                        snack: tempMeal.snack
                    }
                })
            });

            if (res.ok) {
                setWeekPlan({
                    ...weekPlan,
                    [editingDay]: { ...weekPlan[editingDay], lunch: tempMeal.lunch, snack: tempMeal.snack }
                });
                setEditingDay(null);
                alert(`${editingDay}'s menu updated!`);
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            console.error("Save meal plan error:", err);
            alert("Failed to save meal plan.");
        }
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div>
            <header className="ad-header">
                <div>
                    <h1>Meal Planning</h1>
                    <p className="ad-header-subtitle">Weekly nutritional schedule for children</p>
                </div>
                <div className="notification">{Icons.bell}</div>
            </header>

            {/* TODAY'S SPECIAL HIGHLIGHT */}
            <div className="ad-card" style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                border: '1px solid #fcd34d',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{ fontSize: '48px' }}>🍽️</div>
                <div>
                    <h3 style={{ color: '#92400e', marginBottom: '8px' }}>Today's Menu ({today})</h3>
                    {weekPlan[today] ? (
                        <div>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{weekPlan[today].lunch}</p>
                            <p style={{ color: '#b45309', fontWeight: 500 }}>+ {weekPlan[today].snack}</p>
                        </div>
                    ) : (
                        <p style={{ color: '#92400e' }}>No meal plan set for today (Weekend?).</p>
                    )}
                </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: 'var(--ad-text-secondary)' }}>Weekly Schedule</h3>

            <div className="ad-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {Object.keys(weekPlan).map(day => (
                    <div key={day} className="ad-card" style={{
                        borderTop: day === today ? '4px solid #10b981' : '4px solid transparent',
                        position: 'relative',
                        transition: 'transform 0.2s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{
                                fontWeight: 700,
                                color: day === today ? '#10b981' : '#64748b',
                                textTransform: 'uppercase',
                                fontSize: '13px',
                                letterSpacing: '1px'
                            }}>{day}</span>
                            <span style={{ fontSize: '24px' }}>{weekPlan[day].icon}</span>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>LUNCH</label>
                            <p style={{ fontWeight: 600, color: '#334155', marginTop: '4px' }}>{weekPlan[day].lunch}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SNACK</label>
                            <p style={{ color: '#334155', marginTop: '4px' }}>{weekPlan[day].snack}</p>
                        </div>

                        <button
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                background: 'transparent',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                            onClick={() => handleEdit(day)}
                        >
                            Edit Menu
                        </button>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL */}
            {editingDay && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="ad-form-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Update {editingDay}'s Menu</h2>
                        <form onSubmit={handleSave}>
                            <div className="ad-form-group">
                                <label>Lunch Option</label>
                                <input
                                    className="ad-input"
                                    value={tempMeal.lunch}
                                    onChange={e => setTempMeal({ ...tempMeal, lunch: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-group">
                                <label>Snack Option</label>
                                <input
                                    className="ad-input"
                                    value={tempMeal.snack}
                                    onChange={e => setTempMeal({ ...tempMeal, snack: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ad-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setEditingDay(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Menu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
