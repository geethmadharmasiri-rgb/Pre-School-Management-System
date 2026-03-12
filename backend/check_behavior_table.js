const db = require("./db");

async function checkBehaviorTable() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM behavior_reports");
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkBehaviorTable();
