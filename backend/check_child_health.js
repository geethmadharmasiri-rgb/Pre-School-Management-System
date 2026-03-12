const db = require("./db");
const fs = require("fs");

async function checkChildHealthTable() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM child_health");
        fs.writeFileSync("child_health_schema.json", JSON.stringify(columns, null, 2));
        console.log("Schema written to child_health_schema.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkChildHealthTable();
