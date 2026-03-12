
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Gee2002@dh",
    database: process.env.DB_NAME || "preschool_db",
    port: Number(process.env.DB_PORT || 3307),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to database");

        // 1. Create academic_years table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year_name VARCHAR(50) NOT NULL UNIQUE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Table 'academic_years' checked/created.");

        // 2. Insert default academic year if empty
        const [rows] = await connection.query("SELECT COUNT(*) as count FROM academic_years");
        let currentYearId = null;

        if (rows[0].count === 0) {
            const currentYear = new Date().getFullYear();
            const [res] = await connection.query(`
                INSERT INTO academic_years (year_name, start_date, end_date, is_active)
                VALUES (?, ?, ?, TRUE)
            `, [String(currentYear), `${currentYear}-01-01`, `${currentYear}-12-31`]);
            currentYearId = res.insertId;
            console.log(`✅ Created default Academic Year: ${currentYear}`);
        } else {
            const [activeRows] = await connection.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
            if (activeRows.length > 0) currentYearId = activeRows[0].id;
        }

        // 3. Add academic_year_id to classes
        try {
            await connection.query(`ALTER TABLE classes ADD COLUMN academic_year_id INT`);
            console.log("✅ Added 'academic_year_id' column to 'classes'.");

            // Add FK constraint
            await connection.query(`
                ALTER TABLE classes 
                ADD CONSTRAINT fk_classes_academic_year 
                FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) 
                ON DELETE SET NULL
            `);
            console.log("✅ Added Foreign Key constraint.");

        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ Column 'academic_year_id' already exists.");
            } else {
                console.error("⚠️ Error adding column (might already exist):", err.message);
            }
        }

        // 4. Update existing classes to active year if null
        if (currentYearId) {
            const [updateRes] = await connection.query(`
                UPDATE classes SET academic_year_id = ? WHERE academic_year_id IS NULL
            `, [currentYearId]);
            console.log(`✅ Updated ${updateRes.affectedRows} classes to Academic Year ID ${currentYearId}`);
        }

        connection.release();
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
})();
