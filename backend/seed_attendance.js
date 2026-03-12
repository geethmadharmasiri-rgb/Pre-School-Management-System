const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedAttendance() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'preschool_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("🌱 Seeding test attendance...");

        // Get all children
        const [children] = await db.query("SELECT id FROM children");
        if (children.length === 0) {
            console.log("⚠️ No children found. Please run seed_test_data.js first.");
            return;
        }

        // Get a teacher ID
        const [teachers] = await db.query("SELECT id FROM teachers LIMIT 1");
        const teacherId = teachers.length > 0 ? teachers[0].id : 1;

        // Seed for last 7 active days
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            for (const child of children) {
                // Randomly present or absent (approx 80% present)
                const status = Math.random() > 0.2 ? 'Present' : 'Absent';
                await db.query(
                    "INSERT IGNORE INTO attendance (child_id, date, status, check_in_time, marked_by) VALUES (?, ?, ?, ?, ?)",
                    [child.id, dateString, status, status === 'Present' ? '08:00:00' : null, teacherId]
                );
            }
        }

        console.log("✅ Successfully seeded attendance for 7 days.");

    } catch (err) {
        console.error("❌ Seeding failed:", err);
    } finally {
        await db.end();
    }
}

seedAttendance();
