const db = require("./db");

async function addUpdatedAt() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM child_health");
        const hasUpdatedAt = columns.some(c => c.Field === 'updated_at');

        if (!hasUpdatedAt) {
            await db.query("ALTER TABLE child_health ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            console.log("Added updated_at to child_health");
        } else {
            console.log("updated_at already exists in child_health");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addUpdatedAt();
