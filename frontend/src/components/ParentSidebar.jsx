import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "./Icons";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";

export default function ParentSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { unreadCount } = useUnreadNotifications();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/parent-login");
    };

    const isActive = (path) => {
        if (path === "/parent" && location.pathname === "/parent") return true;
        if (path !== "/parent" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const menuItems = [
        { path: "/parent", label: "Dashboard", icon: Icons.dashboard },
        { path: "/parent/children", label: "My Children", icon: Icons.child },
        { path: "/parent/notifications", label: "Notifications", icon: Icons.bell },
        { path: "/parent/events", label: "School Events", icon: Icons.events },
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

            <button className="ad-logout" onClick={logout}>
                <div className="icon">{Icons.logout}</div>
                Logout
            </button>
        </aside>
    );
}
