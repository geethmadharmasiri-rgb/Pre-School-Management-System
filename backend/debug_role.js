const db = require("./db");
async function checkRole() {
    try {
        const [rows] = await db.query("SELECT id, name, role FROM users WHERE role = 'TEACHER' OR role = 'Teacher'");
        console.log("--- TEACHER USERS ---");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkRole();
