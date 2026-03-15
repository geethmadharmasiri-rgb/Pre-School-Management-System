import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "./Icons";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import "./AdminLayout.css";

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { unreadCount } = useUnreadNotifications();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin-login");
    };

    const isActive = (path) => {
        // Exact match or sub-route match
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const menuItems = [
        { path: "/admin", label: "Dashboard", icon: Icons.dashboard },
        { path: "/admin/children", label: "Child Management", icon: Icons.child },
        { path: "/admin/teachers", label: "Teacher Management", icon: Icons.teacher },
        { path: "/admin/classes", label: "Classes", icon: Icons.class },
        { path: "/admin/payments", label: "Payments", icon: Icons.payment },
        { path: "/admin/attendance", label: "Attendance", icon: Icons.attendance },
        { path: "/admin/reports", label: "Reports", icon: Icons.reports },
        { path: "/admin/events", label: "Events", icon: Icons.events },
        { path: "/admin/notifications", label: "Notifications", icon: Icons.bell },
        { path: "/admin/parents", label: "Parent Management", icon: Icons.parents },
        { path: "/admin/academic-years", label: "Academic Sessions", icon: Icons.reports }, // Reusing reports icon for sessions
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="icon">{item.icon}</div>
                            {item.label}
                        </div>
                        {item.label === "Notifications" && unreadCount > 0 && (
                            <span style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                textAlign: 'center'
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            <button className="ad-logout" onClick={handleLogout}>
                <div className="icon">{Icons.logout}</div>
                Logout
            </button>
        </aside>
    );
};

export default AdminSidebar;

