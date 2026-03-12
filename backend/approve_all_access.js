const db = require("./db");

async function approveAll() {
    try {
        console.log("🔧 Approving all parent-child access...");

        // Update all relationships to approved
        const [result] = await db.query(
            "UPDATE parent_child SET status = 'approved'"
        );

        console.log(`✅ Approved ${result.affectedRows} parent-child relationships!`);

        // Show current state
        const [relationships] = await db.query(`
            SELECT u.name as parent_name, u.email,
                   c.first_name, c.last_name,
                   pc.status
            FROM parent_child pc
            JOIN parents p ON pc.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN children c ON pc.child_id = c.id
        `);

        console.log("\n📋 All Parent-Child Relationships:");
        console.table(relationships);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

approveAll();
