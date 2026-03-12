const db = require("./db");
const fs = require("fs");

async function checkConstraints() {
    try {
        const [rows] = await db.query("SHOW CREATE TABLE children");
        fs.writeFileSync("children_create.txt", rows[0]['Create Table']);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConstraints();
