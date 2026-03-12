const db = require("./db");
const bcrypt = require("bcrypt");

async function testAuth() {
    try {
        // Check if we have any teachers
        const [teachers] = await db.query(`
      SELECT t.emp_id, t.nic, u.email, u.role, u.name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LIMIT 5
    `);

        console.log("\n📋 Teachers in database:");
        teachers.forEach(t => {
            console.log(`  - ${t.name} (${t.email}) - Role: ${t.role}`);
            console.log(`    EMP ID: ${t.emp_id}, NIC: ${t.nic || 'N/A'}`);
        });

        // Check if we have any parents
        const [parents] = await db.query(`
      SELECT p.nic, u.email, u.role, u.name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      LIMIT 5
    `);

        console.log("\n📋 Parents in database:");
        parents.forEach(p => {
            console.log(`  - ${p.name} (${p.email}) - Role: ${p.role}`);
            console.log(`    NIC: ${p.nic || 'N/A'}`);
        });

        // Test password hash for a specific user
        if (teachers.length > 0) {
            const [userRows] = await db.query(
                "SELECT password_hash FROM users WHERE email = ? LIMIT 1",
                [teachers[0].email]
            );

            if (userRows.length > 0) {
                console.log(`\n🔐 Testing password for ${teachers[0].email}:`);
                const testPassword = "Sha23456";
                const isValid = await bcrypt.compare(testPassword, userRows[0].password_hash);
                console.log(`  Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

testAuth();
