import { useState, useEffect } from 'react';

export const useUnreadNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            
            const res = await fetch("http://localhost:5000/api/notifications/unread-count", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUnreadCount(data.count || 0);
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return { unreadCount, refresh: fetchUnreadCount };
};
