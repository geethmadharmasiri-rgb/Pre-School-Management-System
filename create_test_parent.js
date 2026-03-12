const db = require('./backend/db');
const bcrypt = require('bcrypt');

(async () => {
    try {
        console.log("Creating test parent...");

        // 1. Create User
        const email = "parent@test.com";
        const password = "password"; // 8 chars
        const hashed = await bcrypt.hash(password, 10);

        // Check availability
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) {
            console.log("⚠️ Test user 'parent@test.com' already exists.");
            // We could reset password here if needed, but let's assume if it exists, the user might know it or we can update it.
            // Let's update the password to be sure.
            await db.query("UPDATE users SET password_hash = ? WHERE email = ?", [hashed, email]);
            console.log("✅ Updated password for 'parent@test.com' to 'password'");
        } else {
            const [userRes] = await db.query(
                "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'PARENT', 1)",
                ["Test Parent", email, hashed]
            );
            const userId = userRes.insertId;

            // 2. Create Parent Profile
            const [parentRes] = await db.query(
                "INSERT INTO parents (user_id, nic, phone, address, occupation) VALUES (?, ?, ?, ?, ?)",
                [userId, "999999999V", "0771234567", "123 Test St", "Tester"]
            );
            console.log("✅ Created new test parent user.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err);
        process.exit(1);
    }
})();
