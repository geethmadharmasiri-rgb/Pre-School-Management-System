const db = require("./db");

async function setupTestAccessData() {
    try {
        console.log("🔧 Setting up test parent-child access data...");

        // Find an existing parent-child relationship
        const [relationships] = await db.query(`
            SELECT pc.parent_id, pc.child_id, p.id as parent_id, c.first_name, c.last_name, u.name as parent_name
            FROM parent_child pc
            JOIN parents p ON pc.parent_id = p.id
            JOIN children c ON pc.child_id = c.id
            JOIN users u ON p.user_id = u.id
            LIMIT 1
        `);

        if (relationships.length === 0) {
            console.log("⚠️ No parent-child relationships found in database.");
            console.log("Please create a parent and child first through the admin panel.");
            process.exit(0);
        }

        const rel = relationships[0];
        console.log(`Found relationship: ${rel.parent_name} -> ${rel.first_name} ${rel.last_name}`);

        // Approve this relationship
        await db.query(
            "UPDATE parent_child SET status = 'approved' WHERE parent_id = ? AND child_id = ?",
            [rel.parent_id, rel.child_id]
        );

        console.log("✅ Approved access for this parent-child relationship!");
        console.log("You can now log in as the parent and access the child profile.");

        // Show all parent-child relationships with their statuses
        const [allRels] = await db.query(`
            SELECT u.name as parent_name, u.email, 
                   c.first_name, c.last_name,
                   pc.status,
                   pc.relationship
            FROM parent_child pc
            JOIN parents p ON pc.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN children c ON pc.child_id = c.id
        `);

        console.log("\n📋 All Parent-Child Relationships:");
        console.table(allRels);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

setupTestAccessData();
