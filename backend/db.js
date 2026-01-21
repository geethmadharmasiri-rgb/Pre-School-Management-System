// db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Gee2002@dh",
  database: process.env.DB_NAME || "preschool_db",
  port: Number(process.env.DB_PORT || 3307), // ✅ important (your MySQL port)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test connection once when server starts
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
  }
})();

module.exports = pool;
