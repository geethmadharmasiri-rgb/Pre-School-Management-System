/**
 * ============================================
 * MOBILE ATTENDANCE API ROUTES (Ver 2.0)
 * ============================================
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

/* =========================
   AUTO-MIGRATIONS
========================= */
(async () => {
  try {
    // 1. Create QR logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qr_attendance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        class_id INT NOT NULL,
        teacher_id INT NOT NULL,
        scan_type ENUM('DROP_OFF', 'PICK_UP') NOT NULL,
        scan_date DATE NOT NULL,
        scan_time TIME NOT NULL,
        status ENUM('SUCCESS', 'DUPLICATE', 'INVALID', 'ERROR') DEFAULT 'SUCCESS',
        scanned_by_user_id INT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_child_date (child_id, scan_date),
        INDEX idx_class_date (class_id, scan_date)
      )
    `);

    // 2. Add check_out_time to existing attendance table if missing
    try {
      await pool.query("ALTER TABLE attendance ADD COLUMN check_out_time TIME NULL AFTER check_in_time");
      console.log("✅ [Mobile Attendance] Column 'check_out_time' added to attendance table");
    } catch (e) {
      // Ignored if column exists
    }

    console.log("✅ [Mobile Attendance] Database schema ready");
  } catch (e) {
    console.error("❌ [Mobile Attendance] Migration error:", e.message);
  }
})();

/* =========================
   MIDDLEWARE
========================= */
function mobileAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

/* =========================
   HELPER: Notify Parents
========================= */
async function notifyParents(childId, title, message) {
  try {
    const [parents] = await pool.query(
      `SELECT p.user_id FROM parents p 
       JOIN parent_child pc ON p.id = pc.parent_id 
       WHERE pc.child_id = ?`,
      [childId]
    );
    for (const parent of parents) {
      await pool.query(
        "INSERT INTO notifications (type, audience, message, target_user_id) VALUES (?, 'PARENT', ?, ?)",
        [title, message, parent.user_id]
      );
    }
  } catch (e) {
    // Log but don't crash the main request — notifications are non-critical
    console.warn("⚠️ Notification insert failed (non-fatal):", e.message);
  }
}

/* =========================
   AUTH
========================= */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = email; // On mobile, we use the 'email' field for any identifier (Email/NIC/EmpID)

    if (!loginId || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    let user = null;

    // 1. Try finding by Email first (Teacher role only)
    const [emailRows] = await pool.query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? AND role = 'TEACHER' LIMIT 1",
      [loginId]
    );

    if (emailRows.length > 0) {
      user = emailRows[0];
    } else {
      // 2. Try finding by NIC or Employee ID
      const [teacherSearch] = await pool.query(
        "SELECT user_id FROM teachers WHERE nic = ? OR emp_id = ? LIMIT 1",
        [loginId, loginId]
      );

      if (teacherSearch.length > 0) {
        const [userRows] = await pool.query(
          "SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = ? AND role = 'TEACHER' LIMIT 1",
          [teacherSearch[0].user_id]
        );
        if (userRows.length > 0) user = userRows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ message: "Account disabled. Please contact admin." });
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get Teacher profile details
    const [teacherProfile] = await pool.query(
      "SELECT id FROM teachers WHERE user_id = ? LIMIT 1", 
      [user.id]
    );

    if (teacherProfile.length === 0) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const teacherId = teacherProfile[0].id;

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        email: user.email, 
        name: user.name, 
        teacherId: teacherId 
      },
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        teacherId: teacherId 
      } 
    });
  } catch (err) {
    console.error("Mobile Auth Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* =========================
   CLASSES & CHILDREN
========================= */
router.get("/teacher/classes", mobileAuth, async (req, res) => {
  try {
    const [teacherRows] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (teacherRows.length === 0) return res.status(404).json({ message: "Teacher not found" });
    const [classes] = await pool.query(
      `SELECT c.id, c.name, c.capacity, ay.year_name, 
       (SELECT COUNT(*) FROM children ch WHERE ch.class_id = c.id) as student_count
       FROM classes c LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.teacher_id = ?`, [teacherRows[0].id]
    );
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/class/:classId/children", mobileAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const [children] = await pool.query(
      "SELECT id, first_name, last_name, gender, profile_picture FROM children WHERE class_id = ?",
      [classId]
    );
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   SCAN LOGIC (with Notifications)
========================= */
router.post("/attendance/scan", mobileAuth, async (req, res) => {
  try {
    const { qrData, classId, scanType, notes } = req.body;

    // Validate scanType
    if (!scanType || !['DROP_OFF', 'PICK_UP'].includes(scanType)) {
      return res.status(400).json({ message: "Invalid or missing scanType. Must be DROP_OFF or PICK_UP.", status: "INVALID" });
    }

    // Validate QR format
    const match = qrData.match(/^ILA-CH-(\d+)$/);
    if (!match) return res.status(400).json({ message: "Invalid QR code format.", status: "INVALID" });
    const childId = parseInt(match[1]);

    // Verify child exists and belongs to this class
    const [childRows] = await pool.query("SELECT first_name, last_name, class_id FROM children WHERE id = ?", [childId]);
    if (childRows.length === 0) return res.status(404).json({ message: "Child not found.", status: "INVALID" });
    
    const child = childRows[0];
    if (child.class_id !== parseInt(classId)) {
      return res.status(400).json({ message: `${child.first_name} is not in this class.`, status: "INVALID" });
    }

    // Get teacher
    const [teacherRows] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (teacherRows.length === 0) return res.status(403).json({ message: "Teacher profile not found." });
    const teacherId = teacherRows[0].id;

    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0];

    // Get today's attendance record for this child
    const [existing] = await pool.query(
      "SELECT id, check_in_time, check_out_time FROM attendance WHERE child_id = ? AND date = ?",
      [childId, today]
    );
    const record = existing[0] || null;

    if (scanType === 'DROP_OFF') {
      // ── DROP-OFF ──────────────────────────────────────────────────────────
      if (record && record.check_in_time) {
        // Already dropped off today
        return res.status(409).json({
          message: `${child.first_name} was already dropped off at ${record.check_in_time.slice(0, 5)}.`,
          status: "ALREADY_DONE",
          child: { name: `${child.first_name} ${child.last_name}` },
          time: record.check_in_time,
        });
      }

      // Create new drop-off record
      await pool.query(
        "INSERT INTO attendance (child_id, class_id, date, status, check_in_time, marked_by, method, remarks) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status='Present', check_in_time=?, marked_by=?, method='QR'",
        [childId, classId, today, 'Present', time, teacherId, 'QR', notes || null, time, teacherId]
      );
      await notifyParents(childId, "Drop-off", `${child.first_name} has arrived at preschool at ${time.slice(0,5)}.`);

      return res.json({
        message: "Drop-off marked successfully!",
        type: 'DROP_OFF',
        child: { name: `${child.first_name} ${child.last_name}` },
        time: time.slice(0, 5),
      });

    } else {
      // ── PICK-UP ───────────────────────────────────────────────────────────
      if (!record || !record.check_in_time) {
        // No drop-off recorded yet — can't pick up
        return res.status(400).json({
          message: `${child.first_name} has not been dropped off today. Please scan Drop-off first.`,
          status: "NO_DROP_OFF",
          child: { name: `${child.first_name} ${child.last_name}` },
        });
      }
      if (record.check_out_time) {
        // Already picked up
        return res.status(409).json({
          message: `${child.first_name} was already picked up at ${record.check_out_time.slice(0, 5)}.`,
          status: "ALREADY_DONE",
          child: { name: `${child.first_name} ${child.last_name}` },
          time: record.check_out_time,
        });
      }

      // Update with pick-up time
      await pool.query(
        "UPDATE attendance SET check_out_time = ?, method = 'QR', marked_by = ? WHERE id = ?",
        [time, teacherId, record.id]
      );
      await notifyParents(childId, "Pick-up", `${child.first_name} has been picked up from preschool at ${time.slice(0,5)}.`);

      return res.json({
        message: "Pick-up marked successfully!",
        type: 'PICK_UP',
        child: { name: `${child.first_name} ${child.last_name}` },
        time: time.slice(0, 5),
      });
    }

  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ message: "Server error during scan." });
  }
});

// Manual attendance marking for phone (with remarks)
router.post("/attendance/manual-mark", mobileAuth, async (req, res) => {
  try {
    const { childId, status, classId, remarks } = req.body;

    if (!['Present', 'PickUp', 'Absent'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'Present', 'PickUp', or 'Absent'." });
    }

    const [teacherRows] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (!teacherRows.length) return res.status(403).json({ message: "Teacher not found" });
    const teacherId = teacherRows[0].id;
    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0];

    const [childRows] = await pool.query("SELECT id, first_name, last_name FROM children WHERE id = ?", [childId]);
    if (!childRows.length) return res.status(404).json({ message: "Child not found" });
    const child = childRows[0];

    if (status === 'Absent') {
      // ── MARK ABSENT ─────────────────────────────────────────────────────
      await pool.query(
        `INSERT INTO attendance (child_id, class_id, date, status, marked_by, method, remarks)
         VALUES (?,?,?,'Absent',?,'MANUAL',?)
         ON DUPLICATE KEY UPDATE status='Absent', check_in_time=NULL, check_out_time=NULL, method='MANUAL', remarks=?`,
        [childId, classId, today, teacherId, remarks || 'Manual absent', remarks || 'Manual absent']
      );
      await notifyParents(childId, "Absence", `${child.first_name} has been marked absent today.`);
      return res.json({ message: `${child.first_name} marked as Absent`, type: 'ABSENT' });
    }

    if (status === 'Present') {
      // ── MANUAL DROP-OFF ──────────────────────────────────────────────────
      const [existing] = await pool.query(
        "SELECT id, check_in_time FROM attendance WHERE child_id = ? AND date = ?", [childId, today]
      );
      if (existing.length && existing[0].check_in_time) {
        return res.status(409).json({ message: `${child.first_name} is already marked as dropped off at ${existing[0].check_in_time.toString().slice(0,5)}.` });
      }
      await pool.query(
        `INSERT INTO attendance (child_id, class_id, date, status, check_in_time, marked_by, method, remarks)
         VALUES (?,?,?,'Present',?,?,'MANUAL',?)
         ON DUPLICATE KEY UPDATE status='Present', check_in_time=?, method='MANUAL', remarks=?`,
        [childId, classId, today, time, teacherId, remarks || 'Manual drop-off', time, remarks || 'Manual drop-off']
      );
      await notifyParents(childId, "Drop-off", `${child.first_name} has been manually marked as arrived at school.`);
      return res.json({ message: `${child.first_name} marked as Present (Drop-off)`, type: 'DROP_OFF', time: time.slice(0,5) });
    }

    if (status === 'PickUp') {
      // ── MANUAL PICK-UP ───────────────────────────────────────────────────
      const [existing] = await pool.query(
        "SELECT id, check_in_time, check_out_time FROM attendance WHERE child_id = ? AND date = ?", [childId, today]
      );
      if (!existing.length || !existing[0].check_in_time) {
        return res.status(400).json({ message: `${child.first_name} has not been dropped off today. Mark drop-off first.` });
      }
      if (existing[0].check_out_time) {
        return res.status(409).json({ message: `${child.first_name} is already picked up at ${existing[0].check_out_time.toString().slice(0,5)}.` });
      }
      await pool.query(
        "UPDATE attendance SET check_out_time = ?, method = 'MANUAL', remarks = ?, marked_by = ? WHERE id = ?",
        [time, remarks || 'Manual pick-up', teacherId, existing[0].id]
      );
      await notifyParents(childId, "Pick-up", `${child.first_name} has been manually marked as picked up.`);
      return res.json({ message: `${child.first_name} marked as Picked Up`, type: 'PICK_UP', time: time.slice(0,5) });
    }

  } catch (err) {
    console.error("Manual mark error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   REPORTING
========================= */
router.get("/attendance/daily/:classId", mobileAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    // Get all children in class
    const [children] = await pool.query(
      "SELECT id, first_name, last_name, gender FROM children WHERE class_id = ?", 
      [classId]
    );
    
    if (children.length === 0) {
      return res.json({ summary: { total: 0, present: 0, completed: 0, absent: 0, notScanned: 0 }, attendance: [] });
    }

    // Get attendance filtered by BOTH date AND class_id
    const [attendanceRows] = await pool.query(
      "SELECT child_id, status, check_in_time, check_out_time, method, remarks FROM attendance WHERE date = ? AND class_id = ?",
      [targetDate, classId]
    );

    const attendance = children.map(c => {
      const row = attendanceRows.find(a => a.child_id === c.id);
      
      let displayStatus = 'NOT_MARKED';
      if (row) {
        if (row.check_out_time) displayStatus = 'COMPLETED';
        else if (row.status === 'Present') displayStatus = 'DROPPED_OFF';
        else if (row.status === 'Absent') displayStatus = 'ABSENT';
      }

      // Format times cleanly (HH:MM only)
      const formatTime = (t) => {
        if (!t) return null;
        const str = t.toString();
        return str.length >= 5 ? str.slice(0, 5) : str;
      };

      return { 
        childId: c.id, 
        name: `${c.first_name} ${c.last_name}`, 
        admissionNumber: c.admission_number || `CH-${c.id}`,
        gender: c.gender, 
        attendanceStatus: displayStatus, 
        dropOffTime: formatTime(row?.check_in_time) || null, 
        pickUpTime: formatTime(row?.check_out_time) || null,
        method: row?.method || null,
        remarks: row?.remarks || null
      };
    });

    res.json({ 
      date: targetDate,
      summary: {
        total: children.length,
        present: attendance.filter(a => a.attendanceStatus === 'DROPPED_OFF').length,
        completed: attendance.filter(a => a.attendanceStatus === 'COMPLETED').length,
        absent: attendance.filter(a => a.attendanceStatus === 'ABSENT').length,
        notScanned: attendance.filter(a => a.attendanceStatus === 'NOT_MARKED').length
      },
      attendance 
    });
  } catch (err) {
    console.error("Daily attendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/attendance/history", mobileAuth, async (req, res) => {
  try {
    const [teacher] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (!teacher.length) return res.status(403).json({ message: "Teacher not found" });
    
    const { classId } = req.query;

    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.method,
        a.remarks,
        a.class_id,
        c.first_name,
        c.last_name,
        cl.name as class_name
      FROM attendance a 
      JOIN children c ON a.child_id = c.id 
      LEFT JOIN classes cl ON a.class_id = cl.id 
      WHERE a.marked_by = ?
    `;
    const params = [teacher[0].id];

    if (classId) {
      query += " AND a.class_id = ?";
      params.push(classId);
    }

    query += " ORDER BY a.date DESC, a.created_at DESC LIMIT 100";

    const [rows] = await pool.query(query, params);

    // Format each row into the structure ScanHistoryScreen expects
    const formatTime = (t) => {
      if (!t) return null;
      const str = t.toString();
      return str.length >= 5 ? str.slice(0, 5) : str;
    };

    // Each attendance record that has check_out_time generates TWO history entries (drop-off + pick-up)
    // Records with only check_in_time generate ONE entry (drop-off)
    const history = [];
    for (const row of rows) {
      const childName = `${row.first_name} ${row.last_name}`;
      const className = row.class_name || `Class ${row.class_id}`;
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date?.toString().split('T')[0] || row.date;

      if (row.check_in_time) {
        history.push({
          id: `${row.id}_drop`,
          childName,
          className,
          scanType: 'DROP_OFF',
          scanDate: dateStr,
          scanTime: formatTime(row.check_in_time),
          method: row.method || 'MANUAL',
          status: 'SUCCESS',
          remarks: row.remarks,
        });
      }

      if (row.check_out_time) {
        history.push({
          id: `${row.id}_pick`,
          childName,
          className,
          scanType: 'PICK_UP',
          scanDate: dateStr,
          scanTime: formatTime(row.check_out_time),
          method: row.method || 'MANUAL',
          status: 'SUCCESS',
          remarks: row.remarks,
        });
      }

      // If absent and no times
      if (!row.check_in_time && !row.check_out_time && row.status === 'Absent') {
        history.push({
          id: `${row.id}_absent`,
          childName,
          className,
          scanType: 'ABSENT',
          scanDate: dateStr,
          scanTime: null,
          method: row.method || 'MANUAL',
          status: 'ABSENT',
          remarks: row.remarks,
        });
      }
    }

    res.json(history);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// History Summary for Web Dashboard
router.get("/teacher/attendance/history-summary", mobileAuth, async (req, res) => {
  try {
    const [teacher] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (!teacher.length) return res.status(403).json({ message: "Teacher not found" });
    
    // Get class for this teacher
    const [classes] = await pool.query("SELECT id FROM classes WHERE teacher_id = ? LIMIT 1", [teacher[0].id]);
    if (!classes.length) return res.json([]);
    const classId = classes[0].id;

    const [rows] = await pool.query(`
      SELECT 
        date,
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as completed_count
      FROM attendance 
      WHERE class_id = ?
      GROUP BY date 
      ORDER BY date DESC 
      LIMIT 14
    `, [classId]);

    res.json(rows);
  } catch (err) {
    console.error("History summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
