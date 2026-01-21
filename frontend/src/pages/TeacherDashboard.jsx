import React, { useState } from "react";
import "./TeacherDashboard.css";

const mockChildren = [
  { id: 1, name: "Shanaya Perera", age: 4, className: "CLASS A", attendance: "Present" },
  { id: 2, name: "Dinusha Ekanayake", age: 3, className: "CLASS A", attendance: "Absent" },
  { id: 3, name: "Noah Herath", age: 4, className: "CLASS A", attendance: "Present" },
  { id: 4, name: "Aviyana Fernando", age: 3, className: "CLASS A", attendance: "Present" },
  { id: 5, name: "Dinithi Weerathunga", age: 4, className: "CLASS A", attendance: "Absent" },
];

export default function TeacherDashboard() {
  // Later you will load real teacher info from backend/localStorage
  const teacherName = "Ms. Clara Perera";
  const teacherRole = "Teacher";
  const classLabel = "CLASS A";

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const handleMenu = (menu) => setActiveMenu(menu);

  return (
    <div className="td-page">
      {/* Sidebar */}
      <aside className="td-sidebar">
        <div className="td-brand">ILA KIDS CAMPUS</div>

        <div className="td-profile">
          <div className="td-avatar">
            {/* Simple avatar circle */}
            <span>👩‍🏫</span>
          </div>
          <div>
            <div className="td-name">{teacherName}</div>
            <div className="td-role">{teacherRole}</div>
          </div>
        </div>

        <nav className="td-nav">
          {["Dashboard", "Attendance", "Homework", "Behavior Reports", "Meal Planning", "Health Information"].map(
            (item) => (
              <button
                key={item}
                className={`td-nav-item ${activeMenu === item ? "active" : ""}`}
                onClick={() => handleMenu(item)}
              >
                {item}
              </button>
            )
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="td-main">
        <div className="td-header">
          <div>
            <h1>Dashboard</h1>
            <p className="td-subtitle">
              Manage your assigned children, mark attendance, upload homework/resources, create behavior reports, and plan meals.
            </p>
          </div>

          <div className="td-class-pill">{classLabel}</div>
        </div>

        <section className="td-card">
          <h2>Assigned Children</h2>

          <div className="td-table-wrap">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Class</th>
                  <th>Attendance</th>
                  <th>Homework</th>
                  <th>Behavior</th>
                  <th>Child Profile</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockChildren.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.age}</td>
                    <td className="td-link">{c.className}</td>
                    <td>
                      <span className={`td-badge ${c.attendance === "Present" ? "present" : "absent"}`}>
                        {c.attendance}
                      </span>
                    </td>
                    <td className="td-link">View</td>
                    <td className="td-link">Report</td>
                    <td className="td-link">View</td>
                    <td>
                      <button className="td-arrow-btn" title="Open">
                        ➜
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (UI only for now) */}
          <div className="td-pagination">
            <button className="td-page-btn">‹</button>
            <button className="td-page-btn active">1</button>
            <button className="td-page-btn">2</button>
            <button className="td-page-btn">3</button>
            <button className="td-page-btn">›</button>
          </div>
        </section>
      </main>
    </div>
  );
}
