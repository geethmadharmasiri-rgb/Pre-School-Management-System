import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "./Icons";

export default function TeacherSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/teacher-login");
  };

  const isActive = (path) => {
    if (path === "/teacher" && location.pathname === "/teacher") return true;
    if (path !== "/teacher" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { path: "/teacher", label: "Dashboard", icon: Icons.dashboard },
    { path: "/teacher/my-class", label: "My Class", icon: Icons.child },
    { path: "/teacher/homework", label: "Homework", icon: Icons.reports }, // Using reports icon for homework
    { path: "/teacher/attendance", label: "Attendance", icon: Icons.attendance },
    { path: "/teacher/behavior-reports", label: "Behavior Reports", icon: Icons.reports },
    { path: "/teacher/meal-planning", label: "Meal Planning", icon: Icons.events }, // Using events icon for meal
    { path: "/teacher/health-info", label: "Health Information", icon: Icons.child }, // Using child icon for health
    { path: "/teacher/notifications", label: "Notifications", icon: Icons.bell },
  ];

  return (
    <aside className="ad-sidebar">
      <h2 className="ad-logo">ILA KIDS CAMPUS</h2>

      <nav className="ad-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`ad-menu-item ${isActive(item.path) ? "active" : ""}`}
          >
            <div className="icon">{item.icon}</div>
            {item.label}
          </Link>
        ))}
      </nav>

      <button className="ad-logout" onClick={logout}>
        <div className="icon">{Icons.logout}</div>
        Logout
      </button>
    </aside>
  );
}
