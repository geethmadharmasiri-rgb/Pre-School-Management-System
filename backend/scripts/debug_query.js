
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

        const query = `
          SELECT cl.*, t.emp_id as teacherEmpId, u.name as teacherName, ay.year_name
          FROM classes cl
          LEFT JOIN teachers t ON cl.teacher_id = t.id
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN academic_years ay ON cl.academic_year_id = ay.id
          ORDER BY cl.name ASC
        `;

        console.log("🏃 Executing Query:");
        console.log(query);

        const [rows] = await connection.query(query);
        console.log(`✅ Query Successful! Returned ${rows.length} rows.`);
        console.log("First row sample:", rows[0]);

        connection.release();
        process.exit(0);

    } catch (err) {
        console.error("❌ Query Failed:", err.sqlMessage || err.message);
        console.error("Full Error:", err);
        process.exit(1);
    }
})();
