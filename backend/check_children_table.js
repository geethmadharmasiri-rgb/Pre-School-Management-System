const db = require("./db");
const fs = require("fs");

async function checkChildrenTable() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM children");
        fs.writeFileSync("children_schema.json", JSON.stringify(columns, null, 2));
        console.log("Schema written to children_schema.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkChildrenTable();
