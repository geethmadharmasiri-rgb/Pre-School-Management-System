const db = require("./db");

async function migrate() {
    try {
        console.log("🔄 Running Attendance Migration...");

        // 1. Add columns to attendance table
        const [columns] = await db.query("SHOW COLUMNS FROM attendance");
        const colNames = columns.map(c => c.Field);

        if (!colNames.includes('check_out_time')) {
            await db.query("ALTER TABLE attendance ADD COLUMN check_out_time TIME NULL AFTER check_in_time");
            console.log("✅ Added check_out_time");
        }

        if (!colNames.includes('method')) {
            await db.query("ALTER TABLE attendance ADD COLUMN method ENUM('QR', 'MANUAL') DEFAULT 'QR' AFTER marked_by");
            console.log("✅ Added method");
        }

        if (!colNames.includes('remarks')) {
            await db.query("ALTER TABLE attendance ADD COLUMN remarks TEXT AFTER method");
            console.log("✅ Added remarks");
        }

        if (!colNames.includes('class_id')) {
            await db.query("ALTER TABLE attendance ADD COLUMN class_id INT AFTER child_id");
            console.log("✅ Added class_id");
        }

        console.log("🎉 Attendance Migration Complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
