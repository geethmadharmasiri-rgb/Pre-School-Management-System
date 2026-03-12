const db = require("./db");

async function checkRoles() {
    try {
        const [rows] = await db.query("SELECT DISTINCT role FROM users");
        console.log("Roles in users table:", rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkRoles();
