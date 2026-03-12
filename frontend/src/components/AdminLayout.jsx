import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
    return (
        <div className="ad-container">
            <AdminSidebar />
            <main className="ad-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
