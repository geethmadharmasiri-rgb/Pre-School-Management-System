const db = require("./db");
async function findNic() {
    try {
        const [rows] = await db.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'nic' AND TABLE_SCHEMA = DATABASE()");
        console.log("Tables with 'nic' column:");
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findNic();
