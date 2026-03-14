require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
// Bumping server to ensure nodemon restart - v3
const jwt = require("jsonwebtoken");
const db = require("./db"); // mysql2/promise pool
const nodemailer = require("nodemailer");

/* =========================
   EMAIL SERVICE CONFIG
   (Configure with your SMTP details in .env)
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail", // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendWelcomeEmail(email, name, password, role) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Pre-School Management System - Your Credentials",
      html: `
        <h2>Welcome ${name}!</h2>
        <p>You have been registered as a <strong>${role}</strong>.</p>
        <p>Your temporary login credentials are as follows:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${password}</li>
        </ul>
        <p>Please login and change your password immediately.</p>
        <a href="http://localhost:5173/login">Click here to Login</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

// OTP Email Function
async function sendOTPEmail(email, name, otp, role) {
  try {
    const roleColors = {
      ADMIN: '#475569',
      TEACHER: '#f97316',
      PARENT: '#10b981'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Password Reset OTP - ILA Kids Campus ${role} Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${roleColors[role] || '#10b981'}; color: white; padding: 20px; text-align: center;">
            <h1>ILA Kids Campus</h1>
            <h2>${role} Portal</h2>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2>Hello ${name},</h2>
            <p>You requested to reset your password. Use the OTP below to verify your identity:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white; display: inline-block; padding: 20px 40px; border-radius: 10px; border: 2px solid ${roleColors[role] || '#10b981'};">
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${roleColors[role] || '#10b981'};">${otp}</div>
              </div>
            </div>
            <p style="color: #ef4444; font-weight: bold;">⚠️ This OTP will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 0.9rem;">Need help? Contact <a href="mailto:support@ilakids.edu">support@ilakids.edu</a></p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ OTP email sending failed:", error.message);
    console.log("-----------------------------------------");
    console.log(`🔑 [DEVELOPMENT MODE] OTP for ${email}: ${otp}`);
    console.log("-----------------------------------------");
    return false; // Still return false to let the route decide
  }
}

// In-memory OTP storage
const otpStore = new Map(); // { email: { otp, role, expiresAt, attempts } }

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   TEST ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Auto-migrate: add teacher_health_notes column and fee_settings table
(async () => {
  try {
    await db.query(`ALTER TABLE child_health ADD COLUMN teacher_health_notes TEXT NULL AFTER health_notes`);
    console.log("✅ Migration: teacher_health_notes column added to child_health");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("✅ teacher_health_notes column already exists");
    } else {
      console.error("Migration error:", e.message);
    }
  }

  try {
    await db.query(`CREATE TABLE IF NOT EXISTS fee_settings (
        id INT PRIMARY KEY DEFAULT 1,
        monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
    await db.query(`INSERT IGNORE INTO fee_settings (id, monthly_fee) VALUES (1, 5000.00)`);
    console.log("✅ fee_settings table ready");
  } catch (e) {
    console.error("fee_settings migration error:", e.message);
  }

  // Add receipt_path column to payments if not exists
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN receipt_path VARCHAR(255) NULL`);
    console.log("✅ Migration: receipt_path column added to payments");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("✅ receipt_path column already exists");
    } else {
      console.error("receipt_path migration error:", e.message);
    }
  }
  // Ensure payments status ENUM includes all necessary values
  try {
    await db.query(`ALTER TABLE payments MODIFY COLUMN status ENUM('Pending', 'Verified', 'Failed', 'Paid', 'Overdue') DEFAULT 'Pending'`);
    console.log("✅ Migration: payments status ENUM updated");
  } catch (e) {
    console.error("payments status migration error:", e.message);
  }
})();

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
async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, name }

    // Backward compatibility for old tokens missing role
    if (!req.user.role && req.user.id) {
        try {
            const [rows] = await db.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
            if (rows.length > 0) req.user.role = rows[0].role;
        } catch (dbErr) {
            console.error("Auth DB fetch role error:", dbErr);
        }
    }
    
    console.log("AUTH DEBUG: Decoded Role:", req.user.role, "ID:", req.user.id);
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

const multer = require("multer");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});

const upload = multer({ storage: storage });

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
   CHILD & PARENT REGISTRATION (ADMIN)
   POST /api/admin/register-child-parents
========================= */
app.post("/api/admin/register-child-parents", authRequired, upload.single('birthCertificate'), async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // When using multer, body fields are plain strings. We need to parse them if they were sent as JSON strings.
    // However, if frontend sends them as individual form-data fields, we assume:
    // child is a JSON string, parents is a JSON string.
    let child, parents;
    try {
      child = JSON.parse(req.body.child);
      parents = JSON.parse(req.body.parents);
    } catch (e) {
      return res.status(400).json({ message: "Invalid JSON data for child or parents" });
    }

    const birthCertificatePath = req.file ? req.file.path : null;

    // 1. Insert Child (Basic Info)
    const [childResult] = await connection.query(
      `INSERT INTO children 
      (first_name, last_name, dob, gender, address, enrollment_date, program_name, birth_certificate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        child.firstName,
        child.lastName,
        child.dob || null,
        child.gender,
        child.address || null,
        child.enrollmentDate || null,
        child.programName || null,
        birthCertificatePath
      ]
    );
    const childId = childResult.insertId;


    // 2. Process Parents
    for (const parent of parents) {
      let parentId = null;

      // Check if parent user already exists by Email
      const [existingUserRows] = await connection.query(
        "SELECT id, role FROM users WHERE email = ? LIMIT 1",
        [parent.email]
      );

      // Check if parent entry already exists by NIC (integrity check)
      const [existingParentRows] = await connection.query(
        "SELECT id, user_id FROM parents WHERE nic = ? LIMIT 1",
        [parent.nic]
      );

      if (existingParentRows.length > 0) {
        // Parent exists in system
        parentId = existingParentRows[0].id;
      } else if (existingUserRows.length > 0) {
        // User exists but maybe not as parent (unlikely logic but handle gracefully)
        // For now assume if email exists, it's the same person.
        // But we need their parent profile. IF they are STAFF but now becoming PARENT too...
        // Complexity: Simplicity first. Assume checking NIC is best for "Existing Parent".
        // If "New Parent" was clicked but email exists -> Error or Link?
        // Let's assume frontend handled "Existing Parent" selection correctly.

        // If we are here, it means we are trying to add a "New Parent" with an existing Email?
        // Frontend validation likely catches this, but if not:
        return res.status(409).json({ message: `Email ${parent.email} is already in use.` });
      } else {
        // === NEW PARENT CREATION ===

        // 1. Create User
        // Use provided temp password or generate one if missing (frontend generates it)
        const tempPassword = parent.tempPassword || Math.random().toString(36).slice(-8);
        console.log(`🔑 TEMP PASSWORD for ${parent.email || 'new parent'}: ${tempPassword}`);
        const hashed = await bcrypt.hash(tempPassword, 10);

        const [userRes] = await connection.query(
          "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'PARENT', 1)",
          [`${parent.firstName} ${parent.lastName}`, parent.email, hashed]
        );
        const newUserId = userRes.insertId;

        // 2. Create Parent Profile
        const [parentRes] = await connection.query(
          "INSERT INTO parents (user_id, nic, phone, address, occupation) VALUES (?, ?, ?, ?, ?)",
          [newUserId, parent.nic, parent.contact, parent.address, parent.occupation || null]
        );
        parentId = parentRes.insertId;

        // 3. Send Email (Side effect, can fail but shouldn't stop flow? Or should?)
        // Better to log error than rollback for email failure, usually.
        sendWelcomeEmail(parent.email, `${parent.firstName} ${parent.lastName}`, tempPassword, "Parent");
      }

      // 3. Link Parent to Child
      if (parentId) {
        await connection.query(
          "INSERT INTO parent_child (parent_id, child_id, relationship, status) VALUES (?, ?, ?, 'approved')",
          [parentId, childId, parent.type] // parent.type is "father", "mother", "guardian"
        );
      }
    }

    await connection.commit();
    res.json({ message: "Child and parents registered successfully", childId });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Registration Transaction Failed:", error);
    res.status(500).json({ message: "Registration failed", error: error.sqlMessage || error.message });
  } finally {
    connection.release();
  }
});

/* =========================
   VERIFY NIC (Forgot Password / First Login)
   POST /api/auth/verify-nic
========================= */
app.post("/api/auth/verify-nic", async (req, res) => {
  try {
    const { nic } = req.body;

    // 1. Check Parents
    const [parentRows] = await db.query(
      "SELECT id FROM parents WHERE nic = ? LIMIT 1",
      [nic]
    );

    if (parentRows.length > 0) {
      const resetToken = jwt.sign({ nic, role: "PARENT" }, process.env.JWT_SECRET, { expiresIn: "15m" });
      return res.json({ message: "NIC Verified", token: resetToken, role: "PARENT" });
    }

    // 2. Check Teachers
    const [teacherRows] = await db.query(
      "SELECT id FROM teachers WHERE nic = ? LIMIT 1",
      [nic]
    );

    if (teacherRows.length > 0) {
      const resetToken = jwt.sign({ nic, role: "TEACHER" }, process.env.JWT_SECRET, { expiresIn: "15m" });
      return res.json({ message: "NIC Verified", token: resetToken, role: "TEACHER" });
    }

    return res.status(404).json({ message: "NIC not found in our records." });

  } catch (error) {
    console.error("Verify NIC Error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

/* =========================
   REQUEST OTP (NIC + Email Verification)
   POST /api/auth/request-otp
========================= */
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { nic, email, role } = req.body;
    console.log(`\n📬 [REQUEST RECEIVED] /api/auth/request-otp`);
    console.log(`   NIC: ${nic}, Email: ${email}, Role: ${role}`);

    if (!nic || !email || !role) {
      return res.status(400).json({ message: "NIC, email, and role are required" });
    }

    // Validate role
    if (!['TEACHER', 'PARENT'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. OTP reset only available for Teachers and Parents." });
    }

    let query = "";
    if (role === "PARENT") {
      query = `
        SELECT u.id, u.name, u.email, u.role 
        FROM parents p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.nic = ? AND u.email = ? AND u.role = 'PARENT' AND u.is_active = 1 
        LIMIT 1
      `;
    } else if (role === "TEACHER") {
      query = `
        SELECT u.id, u.name, u.email, u.role 
        FROM teachers t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.nic = ? AND u.email = ? AND u.role = 'TEACHER' AND u.is_active = 1 
        LIMIT 1
      `;
    }

    const [rows] = await db.query(query, [nic, email]);

    // For security, don't reveal if account exists
    if (rows.length === 0) {
      console.log(`⚠️ OTP requested for non-matching NIC/Email: ${nic} / ${email} (${role})`);
      return res.json({
        message: "If your NIC and email match our records, you will receive an OTP shortly."
      });
    }

    const user = rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in Database
    await db.query(
      "INSERT INTO otps (email, otp, role, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?",
      [email.toLowerCase(), otp, user.role, expiresAt, otp, expiresAt]
    );

    // Send OTP email
    console.log("\n" + "=".repeat(50));
    console.log(`🚀 [DATABASE STORED] GENERATING OTP FOR: ${user.email}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log("=".repeat(50) + "\n");

    const emailSent = await sendOTPEmail(user.email, user.name, otp, user.role);

    if (!emailSent) {
      console.log(`ℹ️  Note: Email failed, but you can use the OTP printed above.`);
      return res.json({
        message: "If your NIC and email match our records, you will receive an OTP shortly. [Check Backend Console for code]",
        isDevMode: true
      });
    }

    res.json({
      message: "If your NIC and email match our records, you will receive an OTP shortly.",
    });
  } catch (error) {
    console.error("Request OTP Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

/* =========================
   VERIFY OTP
   POST /api/auth/verify-otp
========================= */
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Check database for OTP
    const [rows] = await db.query(
      "SELECT * FROM otps WHERE email = ? AND otp = ? LIMIT 1",
      [email.toLowerCase(), otp.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const otpData = rows[0];

    // Check expiration
    if (new Date() > new Date(otpData.expires_at)) {
      await db.query("DELETE FROM otps WHERE email = ?", [email.toLowerCase()]);
      return res.status(401).json({ message: "OTP has expired. Please request a new one." });
    }

    // Get user details to generate token
    const [userRows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND role = ? LIMIT 1",
      [otpData.email, otpData.role]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // OTP verified successfully - generate reset token
    const resetToken = jwt.sign(
      { email: email.toLowerCase(), role: otpData.role, userId: userRows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Delete OTP after successful verification
    await db.query("DELETE FROM otps WHERE email = ?", [email.toLowerCase()]);

    console.log(`✅ OTP verified successfully for ${email}`);

    res.json({
      message: "OTP verified successfully",
      resetToken,
      role: otpData.role
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   RESET PASSWORD (After OTP Verification)
   POST /api/auth/reset-password-otp
========================= */
app.post("/api/auth/reset-password-otp", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    if (newPassword.length !== 8) {
      return res.status(400).json({ message: "Password must be exactly 8 characters" });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired reset token" });
    }

    const { userId, role } = decoded;

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId]);

    console.log(`✅ Password reset successful for user ID: ${userId} (${role})`);

    res.json({
      message: "Password reset successful! You can now login with your new password.",
      role
    });
  } catch (error) {
    console.error("Reset Password OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   RESET PASSWORD
   POST /api/auth/reset-password
========================= */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password required" });
    }

    if (newPassword.length !== 8) {
      return res.status(400).json({ message: "Password must be exactly 8 characters" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session. Please verify NIC again." });
    }

    const { nic, role } = decoded;

    let userId = null;

    if (role === "PARENT") {
      const [rows] = await db.query("SELECT user_id FROM parents WHERE nic = ? LIMIT 1", [nic]);
      if (rows.length > 0) userId = rows[0].user_id;
    } else if (role === "TEACHER") {
      const [rows] = await db.query("SELECT user_id FROM teachers WHERE nic = ? LIMIT 1", [nic]);
      if (rows.length > 0) userId = rows[0].user_id;
    }

    if (!userId) return res.status(404).json({ message: "User record not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId]);

    res.json({
      message: "Password updated successfully. You can now login.",
      role: role // Return role for frontend redirect
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   PASSWORD RESET (EMAIL-BASED)
   In-memory token storage for password reset
========================= */
const resetTokens = new Map(); // { token: { email, role, expiresAt } }

// Helper function to generate secure random token
function generateResetToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to send password reset email
async function sendPasswordResetEmail(email, name, resetToken, role) {
  try {
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const roleColors = {
      ADMIN: '#475569',
      TEACHER: '#f97316',
      PARENT: '#10b981'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Password Reset Request - ILA Kids Campus ${role} Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${roleColors[role] || '#10b981'}; color: white; padding: 20px; text-align: center;">
            <h1>ILA Kids Campus</h1>
            <h2>${role} Portal</h2>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: ${roleColors[role] || '#10b981'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">${resetLink}</p>
            <p style="color: #ef4444; font-weight: bold;">⚠️ This link will expire in 15 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 0.9rem;">Need help? Contact <a href="mailto:support@ilakids.edu">support@ilakids.edu</a></p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Password reset email sending failed:", error);
    // Don't throw error - we still want to return success to user
  }
}

/* =========================
   FORGOT PASSWORD
   POST /api/auth/forgot-password
========================= */
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    // Validate role
    if (!['ADMIN', 'TEACHER', 'PARENT'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Find user by email and role
    const [rows] = await db.query(
      "SELECT id, name, email, role FROM users WHERE email = ? AND role = ? AND is_active = 1 LIMIT 1",
      [email, role]
    );

    if (rows.length === 0) {
      console.log(`⚠️ Password reset requested for non-existent user: ${email} (${role})`);
      return res.json({
        message: "If an account exists with this email, you will receive a password reset link shortly."
      });
    }

    const user = rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in Database
    await db.query(
      "INSERT INTO otps (email, otp, role, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?",
      [email.toLowerCase(), otp, user.role, expiresAt, otp, expiresAt]
    );

    // Log OTP to the backend terminal
    console.log("\n" + "=".repeat(50));
    console.log(`🚀 [DATABASE STORED] GENERATING OTP FOR: ${user.email}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log("=".repeat(50) + "\n");

    res.json({
      message: "If an account exists with this email, you will receive an OTP shortly."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

/* =========================
   FORGOT PASSWORD (NIC-BASED)
   POST /api/auth/forgot-password-nic
========================= */
app.post("/api/auth/forgot-password-nic", async (req, res) => {
  try {
    const { nic, role } = req.body;

    if (!nic || !role) {
      return res.status(400).json({ message: "NIC and role are required" });
    }

    // Validate role
    if (!['ADMIN', 'TEACHER', 'PARENT'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    let query = "";
    let userIdField = "";

    // Different tables have NIC in different places
    if (role === "PARENT") {
      query = `
        SELECT u.id, u.name, u.email, u.role 
        FROM parents p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.nic = ? AND u.role = 'PARENT' AND u.is_active = 1 
        LIMIT 1
      `;
    } else if (role === "TEACHER") {
      query = `
        SELECT u.id, u.name, u.email, u.role 
        FROM teachers t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.nic = ? AND u.role = 'TEACHER' AND u.is_active = 1 
        LIMIT 1
      `;
    } else {
      // Admin users don't have NIC in the current schema
      console.log(`⚠️ Password reset via NIC requested for ADMIN role - not supported`);
      return res.json({
        message: "If an account exists with this NIC, you will receive a password reset link shortly."
      });
    }

    // Find user by NIC and role
    const [rows] = await db.query(query, [nic]);

    // For security, always return success message even if user not found
    if (rows.length === 0) {
      console.log(`⚠️ Password reset requested for non-existent NIC: ${nic} (${role})`);
      return res.json({
        message: "If an account exists with this NIC, you will receive a password reset link shortly."
      });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token in memory
    resetTokens.set(resetToken, {
      email: user.email,
      role: user.role,
      userId: user.id,
      expiresAt
    });

    // Send password reset email
    sendPasswordResetEmail(user.email, user.name, resetToken, user.role);

    console.log(`🔑 Password reset token generated for NIC: ${nic} (${user.role})`);
    console.log(`   User: ${user.email}`);
    console.log(`   Token: ${resetToken}`);
    console.log(`   Expires at: ${new Date(expiresAt).toLocaleString()}`);

    res.json({
      message: "If an account exists with this NIC, you will receive a password reset link shortly."
    });
  } catch (error) {
    console.error("Forgot Password (NIC) Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});



/* =========================
   RESET PASSWORD (EMAIL-BASED)
   POST /api/auth/reset-password-email
========================= */
app.post("/api/auth/reset-password-email", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length !== 8) {
      return res.status(400).json({ message: "Password must be exactly 8 characters" });
    }

    // Check if token exists
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(401).json({
        message: "Invalid or expired reset link. Please request a new password reset."
      });
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token); // Clean up expired token
      return res.status(401).json({
        message: "Reset link has expired. Please request a new password reset."
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashed, tokenData.userId]
    );

    // Invalidate the token
    resetTokens.delete(token);

    console.log(`✅ Password reset successful for user ID: ${tokenData.userId} (${tokenData.email})`);

    res.json({
      message: "Password reset successful! You can now login with your new password.",
      role: tokenData.role // Send role back so frontend can redirect to correct login page
    });
  } catch (error) {
    console.error("Reset Password Email Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Cleanup expired tokens every 30 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired reset tokens`);
  }
}, 30 * 60 * 1000);

// Cleanup expired OTPs every 10 minutes
setInterval(async () => {
  try {
    const [result] = await db.query("DELETE FROM otps WHERE expires_at < NOW()");
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} expired database OTPs`);
    }
  } catch (err) {
    console.error("OTP Cleanup Error:", err);
  }
}, 10 * 60 * 1000);

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, identifier, password, role } = req.body;
    const loginId = identifier || email; // Support both naming conventions

    if (!loginId || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email/NIC, password and role are required" });
    }

    // ✅ IMPORTANT: Admin password must be exactly 8 characters
    if (role === "ADMIN" && password.length !== 8) {
      return res
        .status(400)
        .json({ message: "Admin password must be exactly 8 characters" });
    }

    let user = null;

    // 1. Try finding by Email first
    const [emailRows] = await db.query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
      [loginId]
    );

    if (emailRows.length > 0) {
      user = emailRows[0];
    } else {
      // 2. If not found by email, try finding by NIC (only for Parent/Teacher)
      let userId = null;
      if (role === "PARENT") {
        const [pRows] = await db.query("SELECT user_id FROM parents WHERE nic = ? LIMIT 1", [loginId]);
        if (pRows.length > 0) userId = pRows[0].user_id;
      } else if (role === "TEACHER") {
        const [tRows] = await db.query(
          "SELECT user_id FROM teachers WHERE nic = ? OR emp_id = ? LIMIT 1",
          [loginId, loginId]
        );
        if (tRows.length > 0) userId = tRows[0].user_id;
      }

      if (userId) {
        const [userRows] = await db.query(
          "SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = ? LIMIT 1",
          [userId]
        );
        if (userRows.length > 0) user = userRows[0];
      }
    }

    // ✅ Do NOT reveal whether email/NIC exists
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ enforce role match
    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ enforce active account (works especially for admin)
    if (user.is_active !== 1) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // ✅ bcrypt compare (password in DB MUST be hashed)
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
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
   CHILDREN API (Role-Based)
   GET /api/children
========================= */
app.post("/api/children", authRequired, upload.single("birthCertificate"), async (req, res) => {
  // ENROLL NEW CHILD
  const connection = await db.getConnection();
  try {
    const { first_name, last_name, dob, gender, address, medical_conditions, blood_type, allergies, medications, health_notes, enrollment_date, program_name, class_id } = req.body;
    const birthCertificatePath = req.file ? req.file.path : null;

    await connection.beginTransaction();

    // 1. Insert Child
    const [childRes] = await connection.query(
      `INSERT INTO children 
      (first_name, last_name, dob, gender, address, enrollment_date, program_name, class_id, birth_certificate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, dob, gender,
        address || null,
        enrollment_date || new Date().toISOString().split('T')[0],
        program_name || null, class_id || null,
        birthCertificatePath
      ]
    );
    const childId = childRes.insertId;


    // 2. If it's a PARENT, link automatically
    if (req.user.role === "PARENT") {
      const [parentRows] = await connection.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (parentRows.length > 0) {
        const parentId = parentRows[0].id;
        await connection.query(
          "INSERT INTO parent_child (parent_id, child_id, relationship, status) VALUES (?, ?, 'Parent', 'pending')",
          [parentId, childId]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Child registered successfully", childId });
  } catch (err) {
    await connection.rollback();
    console.error("Enrollment Error:", err);
    res.status(500).json({ message: "Enrollment failed", error: err.message });
  } finally {
    connection.release();
  }
});

app.get("/api/children", authRequired, async (req, res) => {
  try {
    const { scope, yearId } = req.query;
    let query = "";
    let params = [];

    const userRole = (req.user.role || "").toUpperCase();
    // 1. ADMIN - Management View (All inclusive)
    if (userRole === "ADMIN" && scope !== 'my') {
      query = `
        SELECT c.*, cl.name as className, 
               GROUP_CONCAT(u.name SEPARATOR ', ') as parentName, 
               GROUP_CONCAT(p.phone SEPARATOR ', ') as contactNumber,
               ch.blood_type, ch.allergies, ch.medications, ch.health_notes, ch.teacher_health_notes, ch.medical_conditions,
               ch.updated_at as health_updated_at
        FROM children c
        LEFT JOIN classes cl ON c.class_id = cl.id
        LEFT JOIN parent_child pc ON c.id = pc.child_id
        LEFT JOIN parents p ON pc.parent_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN child_health ch ON c.id = ch.child_id
        GROUP BY c.id
      `;
    } 
    // 2. TEACHER - Class View
    else if (userRole === "TEACHER" && scope !== 'my') {
      // Find teacher's assigned class for the specific year
      const [teacherRows] = await db.query(
        "SELECT id FROM teachers WHERE user_id = ? LIMIT 1",
        [req.user.id]
      );
      if (!teacherRows.length) return res.json([]);

      const teacherId = teacherRows[0].id;
      let classQuery = "SELECT id FROM classes WHERE teacher_id = ?";
      let classParams = [teacherId];

      if (yearId) {
        classQuery += " AND academic_year_id = ? ";
        classParams.push(yearId);
      } else {
        classQuery += " AND academic_year_id IN (SELECT id FROM academic_years WHERE is_active = 1) ";
      }

      const [classRows] = await db.query(classQuery + " LIMIT 1", classParams);
      if (!classRows.length) return res.json([]);

      const classId = classRows[0].id;
      query = `
        SELECT c.*, cl.name as className,
               GROUP_CONCAT(u.name SEPARATOR ', ') as parentName, 
               GROUP_CONCAT(p.phone SEPARATOR ', ') as contactNumber, 
               GROUP_CONCAT(p.address SEPARATOR ' | ') as parentAddress,
               ch.blood_type, ch.allergies, ch.medications, ch.health_notes, ch.teacher_health_notes, ch.medical_conditions,
               ch.updated_at as health_updated_at
        FROM children c
        LEFT JOIN classes cl ON c.class_id = cl.id
        LEFT JOIN parent_child pc ON c.id = pc.child_id
        LEFT JOIN parents p ON pc.parent_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN child_health ch ON c.id = ch.child_id
        WHERE c.class_id = ?
        GROUP BY c.id
      `;
      params = [classId];
    } 
    // 3. PARENT (or forced personal scope for Admin/Teacher)
    else {
      const [parentRows] = await db.query(
        "SELECT id FROM parents WHERE user_id = ? LIMIT 1",
        [req.user.id]
      );
      if (!parentRows.length) return res.json([]); // No linked children for this user profile

      const parentId = parentRows[0].id;
      query = `
        SELECT c.*, cl.name as className, pc.status
        FROM children c
        JOIN parent_child pc ON c.id = pc.child_id
        LEFT JOIN classes cl ON c.class_id = cl.id
        WHERE pc.parent_id = ?
      `;
      params = [parentId];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/children error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   TEACHER PROFILE API
   GET /api/teacher/profile
========================= */
app.get("/api/teacher/profile", authRequired, async (req, res) => {
  try {
    if ((req.user.role || "").toUpperCase() !== "TEACHER") {
      return res.status(403).json({ message: "Teacher access required" });
    }
    const { yearId } = req.query;

    let query = `
      SELECT t.*, u.name, u.email, c.name as className, c.id as classId,
             (SELECT COUNT(*) FROM children WHERE class_id = c.id) as childCount,
             (SELECT COUNT(*) FROM children ch_in 
              LEFT JOIN child_health h ON ch_in.id = h.child_id
              WHERE ch_in.class_id = c.id 
              AND (h.allergies IS NOT NULL AND h.allergies != 'None' AND h.allergies != '')
             ) as healthAlertCount,
             (SELECT COUNT(*) FROM children ch_new
              LEFT JOIN child_health h_new ON ch_new.id = h_new.child_id
              WHERE ch_new.class_id = c.id
              AND h_new.updated_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
             ) as recentHealthUpdateCount,
             (SELECT COUNT(*) FROM homework hw WHERE hw.class_id = c.id) as homeworkCount
      FROM teachers t 
      JOIN users u ON t.user_id = u.id 
      LEFT JOIN classes c ON c.teacher_id = t.id 
      WHERE t.user_id = ?
    `;
    let params = [req.user.id];

    if (yearId) {
      query += " AND c.academic_year_id = ? ";
      params.push(yearId);
    } else {
      query += " AND (c.academic_year_id IS NULL OR c.academic_year_id IN (SELECT id FROM academic_years WHERE is_active = 1)) ";
    }

    query += " LIMIT 1 ";

    const [rows] = await db.query(query, params);

    if (!rows.length) {
      // Fallback for profile even without class
      const [basic] = await db.query(
        "SELECT t.*, u.name, u.email FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.user_id = ? LIMIT 1",
        [req.user.id]
      );
      if (!basic.length) return res.status(404).json({ message: "Teacher profile not found" });
      return res.json({ ...basic[0], className: null, childCount: 0 });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ GET /api/teacher/profile server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET SINGLE CHILD (Detail)
   GET /api/children/:id
========================= */
app.get("/api/children/:id", authRequired, async (req, res) => {
  try {
    const childId = req.params.id;
    const userRole = (req.user.role || "").toUpperCase();

    // Authorization Check for PARENT
    if (userRole === "PARENT") {
      const [parentRows] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (!parentRows.length) return res.status(403).json({ message: "Parent profile not found" });
      const [linkRows] = await db.query("SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?", [parentRows[0].id, childId]);
      if (!linkRows.length) return res.status(403).json({ message: "You are not authorized to view this child's profile" });
    }

    const [rows] = await db.query(`
      SELECT c.*, cl.name as className, cl.teacher_id,
             u_t.name as teacherName,
             ch.blood_type, ch.allergies, ch.medications, ch.health_notes, ch.teacher_health_notes, ch.medical_conditions
      FROM children c
      LEFT JOIN classes cl ON c.class_id = cl.id
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u_t ON t.user_id = u_t.id
      LEFT JOIN child_health ch ON c.id = ch.child_id
      WHERE c.id = ?
    `, [childId]);

    if (rows.length === 0) return res.status(404).json({ message: "Child not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/children/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET CHILD HOMEWORK
   GET /api/children/:id/homework
========================= */
app.get("/api/children/:id/homework", authRequired, async (req, res) => {
  try {
    const childId = req.params.id;
    const userRole = (req.user.role || "").toUpperCase();

    // Authorization Check for PARENT
    if (userRole === "PARENT") {
      const [parentRows] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (!parentRows.length) return res.status(403).json({ message: "Parent profile not found" });
      const [linkRows] = await db.query("SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?", [parentRows[0].id, childId]);
      if (!linkRows.length) return res.status(403).json({ message: "You are not authorized to view this child's homework" });
    }

    const [rows] = await db.query(`
      SELECT h.*, u.name as teacherName
      FROM homework h
      JOIN classes cl ON h.class_id = cl.id
      JOIN children ch ON cl.id = ch.class_id
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE ch.id = ?
      ORDER BY h.due_date DESC
    `, [childId]);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/children/:id/homework error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN UPDATE CHILD
   PUT /api/children/:id
========================= */
app.put("/api/children/:id", authRequired, upload.single("birthCertificate"), async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const childId = req.params.id;
    const { first_name, last_name, dob, gender, address, medical_conditions, blood_type, allergies, medications, health_notes, enrollment_date, program_name, class_id } = req.body;

    let query = `
      UPDATE children 
      SET first_name=?, last_name=?, dob=?, gender=?, address=?, enrollment_date=?, program_name=?, class_id=?
    `;
    let params = [first_name, last_name, dob, gender, address, enrollment_date, program_name, class_id];

    if (req.file) {
      query += ", birth_certificate=?";
      params.push(req.file.path);
    }

    query += " WHERE id=?";
    params.push(childId);

    await db.query(query, params);


    res.json({ message: "Child updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   ADMIN DELETE CHILD
   DELETE /api/children/:id
========================= */
app.delete("/api/children/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const childId = req.params.id;

    await db.query("DELETE FROM children WHERE id = ?", [childId]);
    res.json({ message: "Child deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   UPDATE CHILD CONTACT (PARENT)
   PUT /api/children/:id/contact
========================= */
app.put("/api/children/:id/contact", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "PARENT") {
      return res.status(403).json({ message: "Only parents can update contact info" });
    }

    const { phone, address } = req.body;
    const childId = req.params.id;

    // Verify ownership
    const [parentRows] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? LIMIT 1",
      [req.user.id]
    );
    if (!parentRows.length) return res.status(404).json({ message: "Parent not found" });

    const parentId = parentRows[0].id;
    const [linkRows] = await db.query(
      "SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?",
      [parentId, childId]
    );

    if (!linkRows.length) {
      return res.status(403).json({ message: "You are not authorized to update this child's info" });
    }

    // Update parent's contact info (as per requirement: contact number update for child profile)
    await db.query(
      "UPDATE parents SET phone = ?, address = ? WHERE id = ?",
      [phone, address, parentId]
    );

    res.json({ message: "Contact information updated successfully" });
  } catch (err) {
    console.error("PUT /api/children/:id/contact error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE CHILD PROFILE (PARENT/TEACHER/ADMIN)
   PUT /api/children/:id/profile
========================= */
app.put("/api/children/:id/profile", authRequired, upload.single("profilePicture"), async (req, res) => {
  try {
    const childId = req.params.id;
    const { first_name, last_name } = req.body;
    const userRole = (req.user.role || "").toUpperCase();

    // Authorization Check
    if (userRole === "PARENT") {
      const [parentRows] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (!parentRows.length) return res.status(403).json({ message: "Not authorized" });
      const [linkRows] = await db.query("SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?", [parentRows[0].id, childId]);
      if (!linkRows.length) return res.status(403).json({ message: "Not authorized" });
    } else if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    let query = "UPDATE children SET first_name = ?, last_name = ?";
    let params = [first_name, last_name];

    if (req.file) {
      query += ", profile_picture = ?";
      params.push(req.file.path.replace(/\\/g, '/')); // Normalize path for web
    }

    query += " WHERE id = ?";
    params.push(childId);

    await db.query(query, params);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("PUT /api/children/:id/profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE CHILD HEALTH INFO (TEACHER/PARENT/ADMIN)
   PUT /api/children/:id/health-info
========================= */

/* =========================
   TEACHER MANAGEMENT (ADMIN)
========================= */
app.get("/api/admin/teachers", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "TEACHER") return res.status(403).json({ message: "Access denied" });
    const [rows] = await db.query(`
      SELECT 
        t.id, t.user_id, t.emp_id as empId, t.nic, t.qualification, t.experience, t.contact, t.address,
        u.name, u.email, 
        cl.name as assignedClass
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classes cl ON cl.teacher_id = t.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/teachers", authRequired, async (req, res) => {
  const connection = await db.getConnection();
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const { name, email, password, empId, qualification, experience, contact, address, nic } = req.body;

    // Validate required fields
    if (!name || !email || !password || !empId || !nic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for duplicate email, empId, and nic
    const [emailExists] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (emailExists.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const [empIdExists] = await db.query("SELECT id FROM teachers WHERE emp_id = ? LIMIT 1", [empId]);
    if (empIdExists.length > 0) {
      return res.status(409).json({ message: "Employee ID already exists" });
    }

    const [nicExists] = await db.query("SELECT id FROM teachers WHERE nic = ? LIMIT 1", [nic]);
    if (nicExists.length > 0) {
      return res.status(409).json({ message: "NIC already exists" });
    }

    await connection.beginTransaction();

    // 1. Create User
    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'TEACHER', 1)",
      [name, email, hashed]
    );
    const userId = userResult.insertId;

    // 2. Create Teacher Profile
    await connection.query(
      "INSERT INTO teachers (user_id, emp_id, qualification, experience, contact, address, nic) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, empId, qualification, experience, contact, address, nic]
    );

    await connection.commit();
    sendWelcomeEmail(email, name, password, "Teacher");
    res.json({ message: "Teacher registered successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error during teacher registration:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

app.delete("/api/admin/teachers/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const teacherId = req.params.id;

    // 1. Get user_id associated with the teacher
    const [teacherRows] = await db.query("SELECT user_id FROM teachers WHERE id = ?", [teacherId]);
    if (!teacherRows.length) return res.status(404).json({ message: "Teacher not found" });
    const userId = teacherRows[0].user_id;

    // 2. Delete the user (this will cascade delete the teacher profile)
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Teacher deleted successfully" });
  } catch (err) {
    console.error("Delete Teacher Error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

app.put("/api/admin/teachers/:id", authRequired, async (req, res) => {
  const connection = await db.getConnection();
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const teacherId = req.params.id;
    const { name, email, empId, qualification, experience, contact, address, nic } = req.body;

    // 1. Get user_id
    const [tRows] = await db.query("SELECT user_id FROM teachers WHERE id = ?", [teacherId]);
    if (!tRows.length) return res.status(404).json({ message: "Teacher not found" });
    const userId = tRows[0].user_id;

    await connection.beginTransaction();

    // 2. Update User (Name and Email)
    await connection.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, userId]
    );

    // 3. Update Teacher Profile
    await connection.query(
      "UPDATE teachers SET emp_id = ?, qualification = ?, experience = ?, contact = ?, address = ?, nic = ? WHERE id = ?",
      [empId, qualification, experience, contact, address, nic, teacherId]
    );

    await connection.commit();
    res.json({ message: "Teacher updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Update Teacher Error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  } finally {
    connection.release();
  }
});

/* =========================
   HOMEWORK API (TEACHER)
   GET & POST /api/homework
========================= */
app.get("/api/homework", authRequired, async (req, res) => {
  try {
    if ((req.user.role || "").toUpperCase() !== "TEACHER") return res.status(403).json({ message: "Teacher access only" });
    const { yearId } = req.query;

    let query = `
      SELECT h.*, c.name as className
      FROM homework h
      JOIN classes c ON h.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE t.user_id = ?
    `;
    let params = [req.user.id];

    if (yearId) {
      query += " AND c.academic_year_id = ? ";
      params.push(yearId);
    } else {
      query += " AND c.academic_year_id IN (SELECT id FROM academic_years WHERE is_active = 1) ";
    }

    query += " ORDER BY h.due_date DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/homework", authRequired, upload.single("homeworkFile"), async (req, res) => {
  try {
    if ((req.user.role || "").toUpperCase() !== "TEACHER") return res.status(403).json({ message: "Teacher access only" });
    const { title, description, due_date, yearId } = req.body;
    const filePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    const [tRows] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);
    if (!tRows.length) return res.status(404).json({ message: "Teacher profile not found" });
    const teacherId = tRows[0].id;

    let classQuery = "SELECT id FROM classes WHERE teacher_id = ? ";
    let classParams = [teacherId];

    if (yearId) {
      classQuery += " AND academic_year_id = ? ";
      classParams.push(yearId);
    } else {
      classQuery += " AND academic_year_id IN (SELECT id FROM academic_years WHERE is_active = 1) ";
    }

    const [cRows] = await db.query(classQuery + " LIMIT 1", classParams);
    if (!cRows.length) {
      // Check if teacher has ANY class assigned
      const [anyClass] = await db.query("SELECT id FROM classes WHERE teacher_id = ?", [teacherId]);
      if (anyClass.length > 0) {
        return res.status(404).json({
          message: "You are assigned to a class, but not for the selected academic year. Please check your session or contact Admin."
        });
      }
      return res.status(404).json({
        message: "You are not currently assigned to any class. Please contact Admin to assign you to a class first."
      });
    }
    const classId = cRows[0].id;

    await db.query(
      "INSERT INTO homework (class_id, title, description, due_date, file_path) VALUES (?, ?, ?, ?, ?)",
      [classId, title, description, due_date, filePath]
    );

    res.json({ message: "Homework assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/homework/:id", authRequired, upload.single("homeworkFile"), async (req, res) => {
  try {
    if ((req.user.role || "").toUpperCase() !== "TEACHER") return res.status(403).json({ message: "Teacher access only" });
    const { id } = req.params;
    const { title, description, due_date } = req.body;
    let filePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    // Verify ownership (optional but good practice)
    const [hRows] = await db.query(`
      SELECT h.* FROM homework h 
      JOIN classes c ON h.class_id = c.id 
      JOIN teachers t ON c.teacher_id = t.id 
      WHERE h.id = ? AND t.user_id = ?
    `, [id, req.user.id]);

    if (!hRows.length) return res.status(404).json({ message: "Homework not found or unauthorized" });

    if (!filePath) filePath = hRows[0].file_path; // Keep old file if no new one

    await db.query(
      "UPDATE homework SET title = ?, description = ?, due_date = ?, file_path = ? WHERE id = ?",
      [title, description, due_date, filePath, id]
    );

    res.json({ message: "Homework updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/homework/:id", authRequired, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toUpperCase();
    if (userRole !== "TEACHER") {
      console.error(`[DELETE DENIED] User: ${req.user.id}, Role: ${req.user.role}`);
      return res.status(403).json({ 
        message: "Teacher access only",
        debugRole: req.user.role,
        debugId: req.user.id 
      });
    }
    const { id } = req.params;
    console.log(`[DELETE HOMEWORK] Attempting to delete ID: ${id} by Teacher User ID: ${req.user.id}`);

    // Verify ownership
    const [hRows] = await db.query(`
      SELECT h.* FROM homework h 
      JOIN classes c ON h.class_id = c.id 
      JOIN teachers t ON c.teacher_id = t.id 
      WHERE h.id = ? AND t.user_id = ?
    `, [id, req.user.id]);

    if (!hRows.length) {
      console.warn(`[DELETE HOMEWORK] Homework ${id} not found or unauthorized for user ${req.user.id}`);
      return res.status(404).json({ message: "Homework not found or unauthorized" });
    }

    const homework = hRows[0];
    
    // Optional: Delete physical file if it exists
    if (homework.file_path) {
      const fullPath = path.join(__dirname, homework.file_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`[DELETE HOMEWORK] Deleted file: ${fullPath}`);
        } catch (fErr) {
          console.error(`[DELETE HOMEWORK] Failed to delete file: ${fErr.message}`);
        }
      }
    }

    const [result] = await db.query("DELETE FROM homework WHERE id = ?", [id]);
    console.log(`[DELETE HOMEWORK] Successfully deleted ID: ${id}. Rows affected: ${result.affectedRows}`);
    
    res.json({ message: "Homework deleted successfully", id });
  } catch (err) {
    console.error(`[DELETE HOMEWORK] ERROR:`, err);
    res.status(500).json({ message: "Server error during deletion", details: err.message });
  }
});

app.get("/api/homework/:id", authRequired, async (req, res) => {
  try {
    if ((req.user.role || "").toUpperCase() !== "TEACHER") return res.status(403).json({ message: "Teacher access only" });
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT h.* FROM homework h 
      JOIN classes c ON h.class_id = c.id 
      JOIN teachers t ON c.teacher_id = t.id 
      WHERE h.id = ? AND t.user_id = ?
    `, [id, req.user.id]);

    if (!rows.length) return res.status(404).json({ message: "Homework not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   BEHAVIOR API
========================= */
app.get("/api/behavior-reports", authRequired, async (req, res) => {
  try {
    const { yearId, childId } = req.query;
    let query = "";
    let params = [];

    const userRole = (req.user.role || "").toUpperCase();
    if (userRole === "TEACHER") {
      query = `
        SELECT b.*, c.first_name, c.last_name, cl.name as className, u_t.name as teacherName
        FROM behavior_reports b
        JOIN children c ON b.child_id = c.id
        JOIN classes cl ON c.class_id = cl.id
        JOIN teachers t ON b.teacher_id = t.id 
        JOIN users u_t ON t.user_id = u_t.id
        WHERE t.user_id = ?
      `;
      params = [req.user.id];
      if (yearId) {
        query += " AND cl.academic_year_id = ? ";
        params.push(yearId);
      }
    } else if (userRole === "PARENT") {
      // Find parent's children first
      const [parentRows] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (!parentRows.length) return res.json([]);
      const parentId = parentRows[0].id;

      query = `
        SELECT b.*, c.first_name, c.last_name, u_t.name as teacherName
        FROM behavior_reports b
        JOIN children c ON b.child_id = c.id
        JOIN parent_child pc ON c.id = pc.child_id
        JOIN teachers t ON b.teacher_id = t.id 
        JOIN users u_t ON t.user_id = u_t.id
        WHERE pc.parent_id = ?
      `;
      params = [parentId];

      if (childId) {
        query += " AND b.child_id = ? ";
        params.push(childId);
      }
    } else if (userRole === "ADMIN") {
      query = `
          SELECT b.*, c.first_name, c.last_name, u_t.name as teacherName
          FROM behavior_reports b
          JOIN children c ON b.child_id = c.id
          JOIN teachers t ON b.teacher_id = t.id 
          JOIN users u_t ON t.user_id = u_t.id
        `;
    } else {
      return res.status(403).json({ message: `Forbidden (Role: ${req.user.role})` });
    }

    query += " ORDER BY b.date DESC";
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/behavior-reports", authRequired, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toUpperCase();
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Teacher or Admin access required",
        debugRole: req.user.role 
      });
    }

    const { child_id, rating, category, note, date } = req.body;

    // Get teacher ID
    let teacherId = null;
    const [teacherRows] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);

    if (teacherRows.length > 0) {
      teacherId = teacherRows[0].id;
    } else if (userRole === "ADMIN") {
      // Admin is posting, find the teacher for this child's class
      const [classTeacherRows] = await db.query(`
        SELECT cl.teacher_id 
        FROM children c
        JOIN classes cl ON c.class_id = cl.id
        WHERE c.id = ?
      `, [child_id]);

      if (classTeacherRows.length > 0 && classTeacherRows[0].teacher_id) {
        teacherId = classTeacherRows[0].teacher_id;
      } else {
        // Fallback: If no class teacher, maybe find first available teacher?
        const [anyTeacher] = await db.query("SELECT id FROM teachers LIMIT 1");
        if (anyTeacher.length > 0) teacherId = anyTeacher[0].id;
      }
    }

    if (!teacherId) {
      return res.status(404).json({ message: "Teacher profile not found for this account" });
    }

    // Verify teacher owns this child's class
    if (userRole === "TEACHER") {
      const [ownerRows] = await db.query(`
        SELECT c.id 
        FROM children c
        JOIN classes cl ON c.class_id = cl.id
        WHERE c.id = ? AND cl.teacher_id = ?
      `, [child_id, teacherId]);

      if (!ownerRows.length) {
        return res.status(403).json({ message: "Unauthorized: This child is not in your class." });
      }
    }

    // Verify child exists
    const [childRows] = await db.query("SELECT id FROM children WHERE id = ?", [child_id]);
    if (!childRows.length) return res.status(404).json({ message: "Registered child not found" });

    await db.query(`
      INSERT INTO behavior_reports (child_id, teacher_id, date, rating, category, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [child_id, teacherId, date || new Date().toISOString().split('T')[0], rating, category, note]);

    res.json({ message: "Behavior report uploaded successfully" });
  } catch (err) {
    console.error("POST /api/behavior-reports error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/behavior-reports/:id", authRequired, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toUpperCase();
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Teacher or Admin access required PUT" });
    }

    const reportId = req.params.id;
    const { rating, category, note } = req.body;

    if (userRole === "TEACHER") {
      const [tRows] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);
      if (!tRows.length) return res.status(404).json({ message: "Teacher not found" });

      const [rRows] = await db.query("SELECT * FROM behavior_reports WHERE id = ?", [reportId]);
      if (!rRows.length) return res.status(404).json({ message: "Report not found" });

      const childId = rRows[0].child_id;
      const [ownerRows] = await db.query(`
        SELECT c.id 
        FROM children c
        JOIN classes cl ON c.class_id = cl.id
        WHERE c.id = ? AND cl.teacher_id = ?
      `, [childId, tRows[0].id]);

      if (!ownerRows.length && rRows[0].teacher_id !== tRows[0].id) {
          return res.status(403).json({ message: "Unauthorized: You do not have permission to edit this report." });
      }
    }

    await db.query(
      "UPDATE behavior_reports SET rating = ?, category = ?, note = ? WHERE id = ?",
      [rating, category, note, reportId]
    );

    res.json({ message: "Report updated successfully" });
  } catch (err) {
    console.error("PUT /api/behavior-reports error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/behavior-reports/:id", authRequired, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toUpperCase();
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Teacher or Admin access required DELETE" });
    }

    const reportId = req.params.id;

    if (userRole === "TEACHER") {
      const [tRows] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);
      if (!tRows.length) return res.status(404).json({ message: "Teacher not found" });

      const [rRows] = await db.query("SELECT * FROM behavior_reports WHERE id = ?", [reportId]);
      if (!rRows.length) return res.status(404).json({ message: "Report not found" });

      const childId = rRows[0].child_id;
      const [ownerRows] = await db.query(`
        SELECT c.id 
        FROM children c
        JOIN classes cl ON c.class_id = cl.id
        WHERE c.id = ? AND cl.teacher_id = ?
      `, [childId, tRows[0].id]);

      if (!ownerRows.length && rRows[0].teacher_id !== tRows[0].id) {
          return res.status(403).json({ message: "Unauthorized: You do not have permission to delete this report." });
      }
    }

    await db.query("DELETE FROM behavior_reports WHERE id = ?", [reportId]);

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/behavior-reports error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   MEAL PLANS API
========================= */
app.get("/api/meal-plans", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM meal_plans 
      ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/meal-plans error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/meal-plans", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "TEACHER" && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { dayPlan } = req.body; // Expecting { day: 'Monday', lunch: '...', snack: '...' }

    const { day, lunch, snack } = dayPlan;

    // Update or Insert Lunch
    const [lunchExists] = await db.query("SELECT id FROM meal_plans WHERE day_of_week = ? AND meal_type = 'Lunch'", [day]);
    if (lunchExists.length > 0) {
      await db.query("UPDATE meal_plans SET menu = ? WHERE day_of_week = ? AND meal_type = 'Lunch'", [lunch, day]);
    } else {
      await db.query("INSERT INTO meal_plans (day_of_week, meal_type, menu) VALUES (?, 'Lunch', ?)", [day, lunch]);
    }

    // Update or Insert Snack
    const [snackExists] = await db.query("SELECT id FROM meal_plans WHERE day_of_week = ? AND meal_type = 'Snack'", [day]);
    if (snackExists.length > 0) {
      await db.query("UPDATE meal_plans SET menu = ? WHERE day_of_week = ? AND meal_type = 'Snack'", [snack, day]);
    } else {
      await db.query("INSERT INTO meal_plans (day_of_week, meal_type, menu) VALUES (?, 'Snack', ?)", [day, snack]);
    }

    res.json({ message: "Meal plan updated successfully" });
  } catch (err) {
    console.error("PUT /api/meal-plans error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/meal-plans/:day", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "TEACHER" && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { day } = req.params;
    await db.query("DELETE FROM meal_plans WHERE day_of_week = ?", [day]);
    res.json({ message: `Meal plan for ${day} deleted successfully` });
  } catch (err) {
    console.error("DELETE /api/meal-plans error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ACADEMIC YEARS API
   GET /api/admin/academic-years
1600: ========================= */
app.get("/api/admin/academic-years", authRequired, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM academic_years ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/academic-years", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { year_name, is_active } = req.body;

    if (is_active) {
      await db.query("UPDATE academic_years SET is_active = 0");
    }

    const [result] = await db.query(
      "INSERT INTO academic_years (year_name, is_active) VALUES (?, ?)",
      [year_name, is_active ? 1 : 0]
    );

    res.json({ id: result.insertId, message: "Year added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/academic-years/:id/activate", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { id } = req.params;

    await db.query("UPDATE academic_years SET is_active = 0");
    await db.query("UPDATE academic_years SET is_active = 1 WHERE id = ?", [id]);

    res.json({ message: "Year activated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/academic-years/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { id } = req.params;

    // Check if classes exist for this year
    const [classes] = await db.query("SELECT id FROM classes WHERE academic_year_id = ?", [id]);
    if (classes.length > 0) {
      return res.status(400).json({ message: "Cannot delete year with existing classes" });
    }

    await db.query("DELETE FROM academic_years WHERE id = ?", [id]);
    res.json({ message: "Year deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   CLASS MANAGEMENT (ADMIN)
   Updated to support Academic Years
========================= */
app.get("/api/admin/classes", authRequired, async (req, res) => {
  try {
    const { yearId } = req.query;
    let query = `
      SELECT cl.*, t.emp_id as teacherEmpId, u.name as teacherName, ay.year_name
      FROM classes cl
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN academic_years ay ON cl.academic_year_id = ay.id
    `;

    const params = [];
    if (yearId) {
      query += " WHERE cl.academic_year_id = ?";
      params.push(yearId);
    }

    query += " ORDER BY cl.name ASC";

    const [rows] = await db.query(query, params);

    // Also get child counts for each class
    for (let c of rows) {
      const [countRows] = await db.query("SELECT COUNT(*) as count FROM children WHERE class_id = ?", [c.id]);
      c.childCount = countRows[0].count;

      // Get child IDs
      const [childRows] = await db.query("SELECT id FROM children WHERE class_id = ?", [c.id]);
      c.childIds = childRows.map(s => s.id);
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/classes", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "TEACHER") return res.status(403).json({ message: "Access denied" });
    const { name, capacity, teacherId, academicYearId } = req.body;

    // Default to active year if not provided
    let targetYearId = academicYearId;
    if (!targetYearId) {
      const [active] = await db.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
      if (active.length > 0) targetYearId = active[0].id;
    }

    await db.query(
      "INSERT INTO classes (name, capacity, teacher_id, academic_year_id) VALUES (?, ?, ?, ?)",
      [name, capacity, teacherId || null, targetYearId]
    );
    res.json({ message: "Class created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/classes/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "TEACHER") return res.status(403).json({ message: "Access denied" });
    const { name, capacity, teacherId, academicYearId } = req.body;
    const classId = req.params.id;
    await db.query(
      "UPDATE classes SET name = ?, capacity = ?, teacher_id = ?, academic_year_id = ? WHERE id = ?",
      [name, capacity, teacherId || null, academicYearId || null, classId]
    );
    res.json({ message: "Class updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/classes/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "TEACHER") return res.status(403).json({ message: "Access denied" });
    const classId = req.params.id;

    // Optional: unassign children first instead of cascade? 
    // Usually DB has constraints. Let's unassign children from this class first.
    await db.query("UPDATE children SET class_id = NULL WHERE class_id = ?", [classId]);
    await db.query("DELETE FROM classes WHERE id = ?", [classId]);

    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/children/:id/assign-class", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "TEACHER") return res.status(403).json({ message: "Access denied" });
    const { classId } = req.body;
    const childId = req.params.id;
    console.log(`[CLASS ASSIGN] Admin ${req.user.id} assigning child ${childId} to class ${classId}`);

    await db.query("UPDATE children SET class_id = ? WHERE id = ?", [classId, childId]);
    res.json({ message: "Class assigned successfully" });
  } catch (err) {
    console.error("Class Assignment Error:", err);
    res.status(500).json({ message: "Server error during class assignment" });
  }
});



app.put("/api/children/:id/health-info", authRequired, async (req, res) => {
  try {
    const childId = req.params.id;
    const userRole = (req.user.role || "").toUpperCase();

    // Authorization: Admin, Teacher (if assigned), or Parent (if linked)
    if (userRole === "PARENT") {
      const [parent] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
      if (parent.length > 0) {
        const [link] = await db.query("SELECT status FROM parent_child WHERE parent_id = ? AND child_id = ?", [parent[0].id, childId]);
        if (!link.length || link[0].status !== 'approved') {
          return res.status(403).json({ message: "No approved link to this child" });
        }
      } else {
        return res.status(403).json({ message: "Parent profile not found" });
      }
    } else if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized. Health info can only be updated by Teachers or parents." });
    }

    console.log(`[HEALTH UPDATE] Child: ${childId}, Role: ${userRole}, Body:`, req.body);

    if (userRole === "TEACHER") {
      // Teachers can ONLY update teacher_health_notes (their own notes column)
      const { teacher_health_notes } = req.body;
      await db.query(`
        INSERT INTO child_health (child_id, teacher_health_notes)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE 
          teacher_health_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [childId, teacher_health_notes || null, teacher_health_notes || null]);
    } else {
      // Parents and Admins update all fields EXCEPT teacher_health_notes
      const { allergies, medications, health_notes, medical_conditions, blood_type } = req.body;
      await db.query(`
        INSERT INTO child_health (child_id, allergies, medications, health_notes, medical_conditions, blood_type)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          allergies = ?,
          medications = ?,
          health_notes = ?,
          medical_conditions = ?,
          blood_type = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [
        childId, allergies || null, medications || null, health_notes || null, medical_conditions || null, blood_type || null,
        allergies || null, medications || null, health_notes || null, medical_conditions || null, blood_type || null
      ]);
    }

    res.json({ message: "Health information updated successfully" });
  } catch (err) {
    console.error("❌ HEALTH UPDATE ERROR:", err);
    try {
      require('fs').appendFileSync('error_debug.log', `[${new Date().toISOString()}] HEALTH UPDATE ERROR: ${err.stack}\n`);
    } catch (e) { }
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});


/* =========================
   FEE SETTINGS API
========================= */
// Shared: any authenticated user can read the current global fee
app.get("/api/fee-settings", authRequired, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT monthly_fee, updated_at FROM fee_settings WHERE id = 1");
    res.json(rows[0] || { monthly_fee: 5000.00 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/fee-settings", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const [rows] = await db.query("SELECT monthly_fee, updated_at FROM fee_settings WHERE id = 1");
    res.json(rows[0] || { monthly_fee: 5000.00 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/fee-settings", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const rawAmount = (req.body.monthly_fee || "5000").toString().replace(/\s/g, '');
    const monthlyFee = parseFloat(rawAmount);
    if (isNaN(monthlyFee) || monthlyFee <= 0) {
      return res.status(400).json({ message: "Invalid fee amount" });
    }

    // Update the global fee
    await db.query("INSERT INTO fee_settings (id, monthly_fee) VALUES (1, ?) ON DUPLICATE KEY UPDATE monthly_fee = ?", [monthlyFee, monthlyFee]);

    // Update ALL non-paid payment records to use the new fee (Pending, Overdue, Failed, or NULL status)
    await db.query("UPDATE payments SET amount = ? WHERE status IS NULL OR status NOT IN ('Paid', 'Verified')", [monthlyFee]);

    res.json({ message: "Fee updated for all pending payments", monthly_fee: monthlyFee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   PAYMENTS API 
========================= */
app.get("/api/admin/payments", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const { month, year } = req.query; // optional: e.g. ?month=3&year=2026

    // Get the global default fee
    const [feeRows] = await db.query("SELECT monthly_fee FROM fee_settings WHERE id = 1");
    const defaultFee = feeRows.length > 0 ? parseFloat(feeRows[0].monthly_fee) : 5000.00;

    // For each child, get their LATEST payment using a correlated subquery
    // Include ALL statuses (Paid, Pending, Overdue) so admin can see paid children too
    const [rows] = await db.query(`
      SELECT 
        c.id as child_id, c.first_name, c.last_name,
        GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as parent_names,
        MAX(cl.name) as class_name,
        p.id as _pay_id, p.amount, p.payment_date, p.status, p.payment_method, p.receipt_path
      FROM children c
      LEFT JOIN parent_child pc ON c.id = pc.child_id
      LEFT JOIN parents pr ON pc.parent_id = pr.id
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN classes cl ON c.class_id = cl.id
      LEFT JOIN payments p ON p.id = (
        SELECT id FROM payments 
        WHERE child_id = c.id 
        ORDER BY payment_date DESC, id DESC 
        LIMIT 1
      )
      GROUP BY c.id, p.id
      ORDER BY c.first_name ASC
    `);

    let formatted = rows.map(r => ({
      id: r._pay_id ? "P" + r._pay_id.toString().padStart(3, '0') : "PENDING-" + r.child_id,
      actual_pay_id: r._pay_id,
      child_id: r.child_id,
      parent: r.parent_names || "No Parent linked",
      child: r.first_name + " " + r.last_name,
      class: r.class_name || "Unassigned",
      amount: r.amount ? parseFloat(r.amount) : defaultFee,
      date: r.payment_date ? new Date(r.payment_date).toISOString().split('T')[0] : null,
      payment_month: r.payment_date ? new Date(r.payment_date).getMonth() + 1 : null,
      payment_year: r.payment_date ? new Date(r.payment_date).getFullYear() : null,
      status: (r.status === 'Verified' || r.status === 'Paid') ? 'Verified' : ((r.status === 'Failed' || r.status === 'Overdue') ? 'Failed' : 'Pending'),
      type: r.payment_method || "Online",
      receipt_url: r.receipt_path ? `http://localhost:5000/${r.receipt_path}` : null,
      has_receipt: !!r.receipt_path
    }));

    // If month+year filter provided, filter by payment month
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      formatted = formatted.map(r => {
        // Child paid in this month — show their record
        if (r.payment_month === m && r.payment_year === y) return r;
        // Child has no payment for this month — show as Due
        return { ...r, status: 'Due', date: null, has_receipt: false, receipt_url: null, id: "PENDING-" + r.child_id, actual_pay_id: null };
      });
    }

    res.json(formatted);
  } catch (err) {
    console.error("GET /api/admin/payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/payments/child-info/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const childId = req.params.id;

    // Fetch global fee
    const [feeRows] = await db.query("SELECT monthly_fee FROM fee_settings WHERE id = 1");
    const globalFee = feeRows.length > 0 ? parseFloat(feeRows[0].monthly_fee) : 5000.00;

    // Fetch child and parent details
    const [rows] = await db.query(`
      SELECT c.first_name, c.last_name, 
             u.name as parent_name, u.email as parent_email
      FROM children c
      LEFT JOIN parent_child pc ON c.id = pc.child_id
      LEFT JOIN parents p ON pc.parent_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE c.id = ? 
      LIMIT 1
    `, [childId]);

    if (rows.length === 0) return res.status(404).json({ message: "Child not found" });
    
    res.json({
      childName: `${rows[0].first_name} ${rows[0].last_name}`,
      parentName: rows[0].parent_name || 'No Parent Linked',
      globalFee
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/payments", authRequired, upload.single("bankSlip"), async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const { childId, amount, paymentDate, paymentMethod, notes } = req.body;
    if (!childId || !amount) return res.status(400).json({ message: "childId and amount are required" });

    // Handle bank slip upload if provided
    const receiptPath = req.file ? `uploads/${req.file.filename}` : null;
    const payDate = paymentDate || new Date().toISOString().split('T')[0];
    
    // Find parentId linked to child
    const [pcRows] = await db.query("SELECT parent_id FROM parent_child WHERE child_id = ? LIMIT 1", [childId]);
    const parentId = pcRows.length > 0 ? pcRows[0].parent_id : null;

    // Target month processing
    const pDate = new Date(payDate);
    const m = pDate.getMonth();
    const y = pDate.getFullYear();

    // Look for existing pending payment for this exact month (if checking month strictly)
    const [existing] = await db.query(
      "SELECT id FROM payments WHERE child_id = ? AND MONTH(payment_date) = ? AND YEAR(payment_date) = ? LIMIT 1", 
      [childId, m + 1, y]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE payments SET parent_id = IFNULL(?, parent_id), amount = ?, payment_date = ?, payment_method = ?, receipt_path = IFNULL(?, receipt_path), status = 'Paid', notes = ? WHERE id = ?",
        [parentId, parseFloat(amount), payDate, paymentMethod, receiptPath, notes, existing[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO payments (parent_id, child_id, amount, payment_date, payment_method, status, receipt_path, notes) VALUES (?, ?, ?, ?, ?, 'Paid', ?, ?)",
        [parentId, childId, parseFloat(amount), payDate, paymentMethod, receiptPath, notes]
      );
    }

    res.json({ message: "Manual payment recorded successfully" });
  } catch (err) {
    console.error("POST /api/admin/payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/payments/:id/status", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { status, amount } = req.body;
    console.log("PUT /api/admin/payments/:id/status =>", req.params.id, "status:", status, "amount:", amount);
    
    const dbStatus = status === "Verified" ? "Paid" : (status === "Failed" ? "Overdue" : "Pending");
    
    const rawAmount = (amount || "5000").toString().replace(/\s/g, '');
    const payAmount = parseFloat(rawAmount) || 5000.00;
    
    if (req.params.id.startsWith("PENDING-")) {
      const childId = parseInt(req.params.id.split("-")[1]);
      if (!childId) return res.status(400).json({ message: "Invalid child ID" });
      
      const [pc] = await db.query("SELECT parent_id FROM parent_child WHERE child_id = ? LIMIT 1", [childId]);
      let parentId = pc.length > 0 ? pc[0].parent_id : null;

      // Check if a payment already exists for this child that we should update instead
      const [existing] = await db.query("SELECT id FROM payments WHERE child_id = ? ORDER BY id DESC LIMIT 1", [childId]);
      if (existing.length > 0) {
        await db.query("UPDATE payments SET status = ?, amount = ? WHERE id = ?", [dbStatus, payAmount, existing[0].id]);
        return res.json({ message: "Payment updated", actual_pay_id: existing[0].id });
      }

      const [result] = await db.query(
        "INSERT INTO payments (parent_id, child_id, amount, payment_date, payment_method, status) VALUES (?, ?, ?, CURDATE(), 'Cash', ?)",
        [parentId, childId, payAmount, dbStatus]
      );
      return res.json({ message: "Payment created and updated", actual_pay_id: result.insertId });
    }

    // Extract numeric ID from "P001" format
    const numericId = parseInt(req.params.id.replace(/^P0*/i, ''));
    if (!numericId || isNaN(numericId)) {
      return res.status(400).json({ message: "Invalid payment ID: " + req.params.id });
    }
    
    await db.query("UPDATE payments SET status = ?, amount = ? WHERE id = ?", [dbStatus, payAmount, numericId]);
    res.json({ message: "Payment status and amount updated" });
  } catch(err) {
    console.error("PUT /api/admin/payments/:id/status ERROR:", err.message, err.sql || '');
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

app.get("/api/parent/payments", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "PARENT") return res.status(403).json({ message: "Parent only" });

    const [parents] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
    if (!parents.length) return res.status(404).json({ message: "Parent profile not found" });
    const parentId = parents[0].id;

    // Always get current global fee from fee_settings — this is the source of truth
    const [feeRows] = await db.query("SELECT monthly_fee FROM fee_settings WHERE id = 1");
    const globalFee = feeRows.length > 0 ? parseFloat(feeRows[0].monthly_fee) : 5000.00;

    // Fetch children, and for each child get their LATEST payment using a subquery
    const [rows] = await db.query(`
      SELECT 
        c.id as child_id, c.first_name, c.last_name,
        p.id as payment_id, p.amount as paid_amount, p.payment_date, p.status, p.payment_method, p.receipt_path
      FROM children c
      JOIN parent_child pc ON c.id = pc.child_id
      LEFT JOIN payments p ON p.id = (
        SELECT id FROM payments 
        WHERE child_id = c.id 
        ORDER BY payment_date DESC, id DESC 
        LIMIT 1
      )
      WHERE pc.parent_id = ?
      ORDER BY c.first_name ASC
    `, [parentId]);

    const result = rows.map(r => ({
      child_id: r.child_id,
      first_name: r.first_name,
      last_name: r.last_name,
      payment_id: r.payment_id,
      // Always show the global fee — admin controls this
      amount: globalFee,
      // Show what was actually paid if verified
      paid_amount: r.paid_amount || null,
      payment_date: r.payment_date,
      // Map DB ENUMs to strings expected by parent dashboard
      status: (r.status === 'Verified' || r.status === 'Paid') ? 'Paid' : ((r.status === 'Failed' || r.status === 'Overdue') ? 'Overdue' : (r.status || 'Pending')),
      payment_method: r.payment_method,
      receipt_url: r.receipt_path ? `http://localhost:5000/${r.receipt_path}` : null
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/parent/payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/parent/children/:childId/payment-history", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "PARENT") return res.status(403).json({ message: "Parent only" });

    const childId = req.params.childId;
    const [parents] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
    if (!parents.length) return res.status(404).json({ message: "Parent profile not found" });
    const parentId = parents[0].id;

    const [link] = await db.query("SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?", [parentId, childId]);
    if (!link.length) return res.status(403).json({ message: "Access denied" });

    const [feeRows] = await db.query("SELECT monthly_fee FROM fee_settings WHERE id = 1");
    const globalFee = feeRows.length > 0 ? parseFloat(feeRows[0].monthly_fee) : 5000.00;

    const [rows] = await db.query(`
      SELECT id, amount, payment_date, status, payment_method, receipt_path
      FROM payments 
      WHERE child_id = ?
      ORDER BY payment_date DESC
    `, [childId]);

    res.json({
      history: rows.map(r => ({
        ...r,
        display_status: (r.status === 'Verified' || r.status === 'Paid') ? 'Paid' : ((r.status === 'Failed' || r.status === 'Overdue') ? 'Overdue' : (r.status || 'Pending')),
        receipt_url: r.receipt_path ? `http://localhost:5000/${r.receipt_path}` : null
      })),
      globalFee
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Parent submits a payment with receipt image
app.post("/api/parent/payments/submit", authRequired, upload.single("receipt"), async (req, res) => {
  try {
    if (req.user.role !== "PARENT") return res.status(403).json({ message: "Parent only" });

    const { child_id, amount, payment_date, payment_method } = req.body;
    if (!child_id || !amount) return res.status(400).json({ message: "child_id and amount are required" });

    const [parents] = await db.query("SELECT id FROM parents WHERE user_id = ?", [req.user.id]);
    if (!parents.length) return res.status(404).json({ message: "Parent profile not found" });
    const parentId = parents[0].id;

    // Verify the child belongs to this parent
    const [link] = await db.query("SELECT 1 FROM parent_child WHERE parent_id = ? AND child_id = ?", [parentId, child_id]);
    if (!link.length) return res.status(403).json({ message: "Child not linked to this parent" });

    const receiptPath = req.file ? `uploads/${req.file.filename}` : null;
    const payDate = payment_date || new Date().toISOString().split('T')[0];
    const method = payment_method || 'Bank Transfer';

    // Check if there's an existing Pending payment for this child
    const [existing] = await db.query("SELECT id FROM payments WHERE child_id = ? AND status = 'Pending' LIMIT 1", [child_id]);

    if (existing.length > 0) {
      // Update existing pending payment with receipt
      await db.query(
        "UPDATE payments SET amount = ?, payment_date = ?, payment_method = ?, receipt_path = ? WHERE id = ?",
        [parseFloat(amount), payDate, method, receiptPath, existing[0].id]
      );
    } else {
      // Create new payment record
      await db.query(
        "INSERT INTO payments (parent_id, child_id, amount, payment_date, payment_method, status, receipt_path) VALUES (?, ?, ?, ?, ?, 'Pending', ?)",
        [parentId, child_id, parseFloat(amount), payDate, method, receiptPath]
      );
    }

    res.json({ message: "Payment submitted successfully. Awaiting admin verification." });
  } catch (err) {
    console.error("POST /api/parent/payments/submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/admin/parents/search", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { nic } = req.query;
    if (!nic) return res.json([]);

    const searchPattern = `%${nic}%`;

    // Find the person matching NIC AND any other parents who share children with them
    const [rows] = await db.query(`
      SELECT DISTINCT p.id, p.nic, p.phone, p.address, p.occupation, u.name, u.email,
             (p.nic LIKE ?) as isPrimary,
             (
               SELECT GROUP_CONCAT(DISTINCT relationship)
               FROM parent_child
               WHERE parent_id = p.id
             ) as previousRoles
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.nic LIKE ?
         OR p.id IN (
           SELECT pc2.parent_id
           FROM parent_child pc1
           JOIN parent_child pc2 ON pc1.child_id = pc2.child_id
           WHERE pc1.parent_id IN (SELECT id FROM parents WHERE nic LIKE ?)
         )
      ORDER BY isPrimary DESC, u.name ASC
    `, [searchPattern, searchPattern, searchPattern]);

    res.json(rows);
  } catch (err) {
    console.error("Parent Search Error:", err);
    res.status(500).json({ message: "Server error during parent search" });
  }
});

app.get("/api/admin/parents", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    // Get all parents with basic info
    const [parents] = await db.query(`
      SELECT p.id, p.nic, p.phone, p.address, p.occupation,
             u.name, u.email
      FROM parents p 
      JOIN users u ON p.user_id = u.id
    `);

    // For each parent, get their children with status
    for (let parent of parents) {
      const [children] = await db.query(`
        SELECT c.id, c.first_name, c.last_name, 
               pc.relationship, 
               COALESCE(pc.status, 'pending') as status
        FROM parent_child pc
        JOIN children c ON pc.child_id = c.id
        WHERE pc.parent_id = ?
      `, [parent.id]);

      // Format as "id:name:status" separated by ";;"
      if (children.length > 0) {
        parent.childrenDetails = children.map(c =>
          `${c.id}:${c.first_name} ${c.last_name}:${c.status}`
        ).join(';;');

        // Also keep the first relationship type as "type"
        parent.type = children[0].relationship || 'Parent';
      } else {
        parent.childrenDetails = null;
        parent.type = 'Parent';
      }
    }

    res.json(parents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/parents/:id", authRequired, async (req, res) => {
  const connection = await db.getConnection();
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const parentId = req.params.id;
    const { name, nic, phone, type, email, address, occupation } = req.body; // Expanded fields

    await connection.beginTransaction();

    // 1. Get User ID
    const [parentRows] = await connection.query("SELECT user_id FROM parents WHERE id = ?", [parentId]);
    if (!parentRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Parent not found" });
    }
    const userId = parentRows[0].user_id;

    // 2. Update User (Name, Email)
    if (email) {
      // Basic check if email exists? Skipping for brevity/MVP robustness
      await connection.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, userId]);
    } else {
      await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, userId]);
    }

    // 3. Update Parent Profile (NIC, Phone, Address, Occupation)
    await connection.query("UPDATE parents SET nic = ?, phone = ?, address = ?, occupation = ? WHERE id = ?", [nic, phone, address, occupation, parentId]);

    // 4. Update Relationship (Role) in parent_child - Update ALL links for this parent
    if (type) {
      await connection.query("UPDATE parent_child SET relationship = ? WHERE parent_id = ?", [type, parentId]);
    }

    await connection.commit();
    res.json({ message: "Parent updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

app.delete("/api/admin/parents/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const parentId = req.params.id;

    // Check if parent has children. 
    // Usually if a parent is deleted, we might want to keep the child? 
    // Or if the last parent is deleted, what happens?
    // For now, CASCADE delete in DB handles user deletion. 
    // We should delete the USER associated with this parent.
    const [parentRows] = await db.query("SELECT user_id FROM parents WHERE id = ?", [parentId]);
    if (!parentRows.length) return res.status(404).json({ message: "Parent not found" });

    const userId = parentRows[0].user_id;
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Parent and associated user deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   APPROVE/REJECT PARENT ACCESS (ADMIN)
   PUT /api/admin/access-request
========================= */
app.put("/api/admin/access-request", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const { parentId, childId, status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db.query(
      "UPDATE parent_child SET status = ? WHERE parent_id = ? AND child_id = ?",
      [status, parentId, childId]
    );

    res.json({ message: `Access request ${status}` });
  } catch (err) {
    console.error("Access Request Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   EVENTS API (ADMIN/PUBLIC)
========================= */
app.get("/api/events", async (req, res) => {
  try {
    const [events] = await db.query("SELECT * FROM events ORDER BY date DESC");

    // Get gallery for each event
    for (const event of events) {
      const [images] = await db.query("SELECT image_path FROM event_gallery WHERE event_id = ?", [event.id]);
      // Normalize paths for frontend and ensure they are absolute URLs or correct relative paths
      event.images = images.map(img => img.image_path.replace(/\\/g, '/'));
    }

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/events", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { title, date, time, location } = req.body;

    const [result] = await db.query(
      "INSERT INTO events (title, date, time, location, status) VALUES (?, ?, ?, ?, 'upcoming')",
      [title, date, time || null, location || null]
    );

    res.json({ message: "Event created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload images to event gallery
app.post("/api/events/:id/gallery", authRequired, upload.array("images", 10), async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    const eventId = req.params.id;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const values = req.files.map(file => [eventId, file.path.replace(/\\/g, '/')]);

    await db.query(
      "INSERT INTO event_gallery (event_id, image_path) VALUES ?",
      [values]
    );

    res.json({ message: `${req.files.length} images uploaded to gallery` });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/events/:id/status", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { status } = req.body;
    await db.query("UPDATE events SET status = ? WHERE id = ?", [status.toLowerCase(), req.params.id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/events/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

    // 1. Get image paths to delete files (optional but cleaner)
    const [images] = await db.query("SELECT image_path FROM event_gallery WHERE event_id = ?", [req.params.id]);

    // 2. Delete files from disk
    images.forEach(img => {
      const fullPath = path.join(__dirname, img.image_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // 3. Delete from DB (foreign keys should handle event_gallery, but we can be explicit or rely on ON DELETE CASCADE)
    await db.query("DELETE FROM events WHERE id = ?", [req.params.id]);

    res.json({ message: "Event and associated gallery deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   NOTIFICATIONS API
========================= */
app.get("/api/notifications", authRequired, async (req, res) => {
  try {
    let query = "SELECT * FROM notifications";
    let params = [];

    if (req.user.role === "ADMIN") {
      // Admins see everything
      query += " ORDER BY created_at DESC LIMIT 50";
    } else {
      // Filter by audience
      query += " WHERE audience IN ('Global', 'Both', ?) ORDER BY created_at DESC LIMIT 50";
      params.push(req.user.role === 'PARENT' ? 'Parents' : 'Teachers');
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/notifications", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { type, audience, message } = req.body;

    await db.query(
      "INSERT INTO notifications (type, audience, message) VALUES (?, ?, ?)",
      [type, audience, message]
    );

    res.json({ message: "Notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ATTENDANCE API
========================= */
app.post("/api/attendance", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "TEACHER") return res.status(403).json({ message: "Teacher access required" });

    const { date, attendanceData } = req.body; // array of { child_id, status, check_in_time }

    // Get teacher id
    const [tRows] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);
    const teacherId = tRows[0].id;

    for (const record of attendanceData) {
      await db.query(
        "INSERT INTO attendance (child_id, date, status, check_in_time, marked_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, check_in_time = ?, marked_by = ?",
        [record.child_id, date, record.status, record.check_in_time, teacherId, record.status, record.check_in_time, teacherId]
      );
    }

    res.json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DASHBOARD STATS API (ADMIN)
========================= */
app.get("/api/admin/stats", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
    const { yearId } = req.query;

    let childQuery = "SELECT COUNT(*) as childrenCount FROM children";
    let classQuery = "SELECT COUNT(*) as classesCount FROM classes";
    let params = [];

    if (yearId) {
      childQuery += " WHERE class_id IN (SELECT id FROM classes WHERE academic_year_id = ?)";
      classQuery += " WHERE academic_year_id = ?";
      params = [yearId];
    }

    const [[{ childrenCount }]] = await db.query(childQuery, params);
    const [[{ teachersCount }]] = await db.query("SELECT COUNT(*) as teachersCount FROM teachers");
    const [[{ classesCount }]] = await db.query(classQuery, params);

    // Get Attendance Stats for the last 7 days
    const [attendanceRows] = await db.query(`
      SELECT date, COUNT(*) as presentCount 
      FROM attendance 
      WHERE status = 'Present' 
      AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `);

    // Calculate percentage based on total students (for simplicity in this view)
    const formattedAttendance = attendanceRows.map(row => ({
      date: row.date,
      percentage: childrenCount > 0 ? Math.round((row.presentCount / childrenCount) * 100) : 0
    }));

    res.json({
      totalChildren: childrenCount,
      totalTeachers: teachersCount,
      totalClasses: classesCount,
      attendanceStats: formattedAttendance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});








app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

/* =========================
   START SERVER
   ========================= */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
});




















