import React from "react";
import { Outlet } from "react-router-dom";
import ParentSidebar from "./ParentSidebar";
import "./AdminLayout.css";

export default function ParentLayout() {
    return (
        <div className="ad-container">
            <ParentSidebar />
            <main className="ad-main">
                <Outlet />
            </main>
        </div>
    );
}
