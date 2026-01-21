require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

async function seedAdmin() {
  const name = "Super Admin";
  const email = "admin@ilakids.lk";
  const plainPassword = "Admin123"; // ✅ exactly 8 chars

  if (plainPassword.length !== 8) {
    console.log("❌ Password must be exactly 8 characters");
    process.exit(1);
  }

  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

  const password_hash = await bcrypt.hash(plainPassword, 10);

  if (existing.length > 0) {
    // Update existing admin password safely
    await db.query(
      "UPDATE users SET name=?, password_hash=?, role='ADMIN', is_active=1 WHERE email=?",
      [name, password_hash, email]
    );
    console.log("✅ Admin updated (email already existed).");
  } else {
    // Insert new admin
    await db.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'ADMIN', 1)",
      [name, email, password_hash]
    );
    console.log("✅ Admin created.");
  }

  console.log("LOGIN DETAILS:");
  console.log("Email:", email);
  console.log("Password:", plainPassword);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
