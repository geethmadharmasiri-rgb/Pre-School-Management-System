
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

        // 1. Add birth_certificate column if it doesn't exist
        try {
            await connection.query("ALTER TABLE children ADD COLUMN birth_certificate VARCHAR(255) DEFAULT NULL");
            console.log("✅ Added birth_certificate column");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ birth_certificate column already exists");
            } else {
                console.error("❌ Failed to add birth_certificate column:", err.message);
            }
        }

        // 2. Modify program_name to be nullable
        try {
            // Note: Syntax might vary slightly depending on MySQL version but MODIFY COLUMN is standard
            await connection.query("ALTER TABLE children MODIFY COLUMN program_name VARCHAR(255) NULL");
            console.log("✅ Modified program_name to be nullable");
        } catch (err) {
            console.error("❌ Failed to modify program_name column:", err.message);
        }

        connection.release();
        process.exit(0);

    } catch (err) {
        console.error("❌ Script failed:", err);
        process.exit(1);
    }
})();
