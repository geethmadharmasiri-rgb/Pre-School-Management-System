const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedEvents() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'preschool_db',
        port: process.env.DB_PORT || 3306
    });


    try {
        console.log("🌱 Seeding test events...");

        // Check if events table has data
        const [rows] = await db.query("SELECT COUNT(*) as count FROM events");
        if (rows[0].count === 0) {
            const testEvents = [
                ['Annual Prize Giving 2024', '2024-12-15', '09:00:00', 'Main School Hall', 'Upcoming'],
                ['Parent-Teacher Meeting', '2024-11-20', '14:30:00', 'Classrooms', 'Upcoming'],
                ['Kids Sports Day', '2024-10-05', '08:00:00', 'School Grounds', 'Completed'],
                ['Art Exhibition', '2024-09-15', '10:00:00', 'Activity Room', 'Completed']
            ];

            for (const event of testEvents) {
                await db.query(
                    "INSERT INTO events (title, date, time, location, status) VALUES (?, ?, ?, ?, ?)",
                    event
                );
            }
            console.log("✅ Successfully seeded 4 test events.");
        } else {
            console.log("ℹ️ Events table already has data. Skipping seed.");
        }

    } catch (err) {
        console.error("❌ Seeding failed:", err);
    } finally {
        await db.end();
    }
}

seedEvents();
