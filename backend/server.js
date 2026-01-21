require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db"); // mysql2/promise pool

const app = express();

console.log("✅ UPDATED server.js RUNNING");

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost:")) return callback(null, true);
      if (origin.startsWith("http://127.0.0.1:")) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

/* =========================
   TEST ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// ✅ Improved DB test
app.get("/test-db", async (req, res) => {
  try {
    const [okRows] = await db.query("SELECT 1 AS ok");
    const [dbRows] = await db.query("SELECT DATABASE() AS db");
    const [tableRows] = await db.query("SHOW TABLES");

    res.json({
      ok: okRows[0],
      connectedDatabase: dbRows[0],
      tables: tableRows,
    });
  } catch (err) {
    console.error("DB ERROR (/test-db):", err);
    return res.status(500).json({
      step: "DB test failed",
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      message: err.message,
    });
  }
});

/* =========================
   AUTH MIDDLEWARE
========================= */
function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, name }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

/* =========================
   PARENT REGISTRATION
   POST /api/auth/register-parent
========================= */
app.post("/api/auth/register-parent", async (req, res) => {
  console.log("✅ HIT register-parent:", req.body?.email);

  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // ✅ Your project rule: passwords must be exactly 8 characters (for parents too)
    if (password.length !== 8) {
      return res
        .status(400)
        .json({ message: "Password must be exactly 8 characters" });
    }

    const [existRows] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existRows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'PARENT', 1)",
      [name, email, hashed]
    );

    const userId = userResult.insertId;

    await db.query(
      "INSERT INTO parents (user_id, phone, address) VALUES (?, ?, ?)",
      [userId, phone || null, address || null]
    );

    // Optional: track last_login_at on registration
    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      userId,
    ]);

    const token = jwt.sign(
      { id: userId, role: "PARENT", email, name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Registration successful",
      token,
      user: { id: userId, name, email, role: "PARENT" },
    });
  } catch (err) {
    console.error("SERVER ERROR (register-parent):", err);
    return res.status(500).json({
      message: err.sqlMessage || err.message || "Server error",
      code: err.code,
    });
  }
});

/* =========================
   LOGIN (UPDATED FOR ADMIN PROCESS)
   POST /api/auth/login
========================= */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password and role are required" });
    }

    // ✅ IMPORTANT: Admin password must be exactly 8 characters
    if (role === "ADMIN" && password.length !== 8) {
      return res
        .status(400)
        .json({ message: "Admin password must be exactly 8 characters" });
    }

    // ✅ Get user including is_active
    const [rows] = await db.query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    // ✅ Do NOT reveal whether email exists
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // ✅ enforce role match
    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ enforce active account (works especially for admin)
    if (user.is_active !== 1) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // ✅ bcrypt compare (password in DB MUST be hashed)
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ update last login
    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    // ✅ token payload includes name (useful for admin dashboard welcome)
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: role === "ADMIN" ? "2h" : "7d" } // admin shorter session
    );

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("SERVER ERROR (login):", err);
    return res.status(500).json({
      message: err.sqlMessage || err.message || "Server error",
      code: err.code,
    });
  }
});

/* =========================
   PARENT DASHBOARD ACCESS
   GET /api/parents/me
========================= */
app.get("/api/parents/me", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "PARENT") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await db.query(
      `SELECT u.id AS userId, u.name, u.email,
              p.id AS parentId, p.phone, p.address
       FROM users u
       JOIN parents p ON p.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("DB ERROR (parents/me):", err);
    return res.status(500).json({
      message: err.sqlMessage || err.message || "Database error",
      code: err.code,
    });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
});




















