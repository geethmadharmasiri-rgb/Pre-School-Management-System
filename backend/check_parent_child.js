const db = require("./db");
const fs = require("fs");

async function checkParentChildTable() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM parent_child");
        fs.writeFileSync("parent_child_schema.json", JSON.stringify(columns, null, 2));
        console.log("Schema written to parent_child_schema.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkParentChildTable();
