const db = require("./db");
async function check() {
    try {
        const [triggers] = await db.query("SHOW TRIGGERS");
        console.log("Triggers:");
        console.log(triggers);

        const [sqlMode] = await db.query("SELECT @@sql_mode");
        console.log("SQL Mode:");
        console.log(sqlMode);

        const [parentsSchema] = await db.query("DESCRIBE parents");
        console.log("Parents Schema:");
        console.log(parentsSchema);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
