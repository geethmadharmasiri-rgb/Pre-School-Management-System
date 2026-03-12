require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

async function seedTestData() {
    try {
        console.log("🌱 Seeding test data...");

        // 1. Create Teacher
        console.log("Step 1: Teacher User");
        const teacherEmail = "teacher@example.com";
        const teacherPassword = "Teacher1"; // 8 chars

        let teacherId;
        let existingTeacher;
        try {
            [existingTeacher] = await db.query("SELECT id FROM users WHERE email = ?", [teacherEmail]);
        } catch (e) { console.error("Error checking existing teacher user:", e); throw e; }

        if (existingTeacher.length > 0) {
            console.log("Teacher user already exists.");
            try {
                const [teacherProfiles] = await db.query("SELECT id FROM teachers WHERE user_id = ?", [existingTeacher[0].id]);
                if (teacherProfiles.length > 0) {
                    teacherId = teacherProfiles[0].id;
                } else {
                    const [teacherRes] = await db.query(
                        "INSERT INTO teachers (user_id, emp_id, qualification, experience, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
                        [existingTeacher[0].id, "EMP001", "B.Ed", "5 Years", "+94 77 111 2222", "Colombo, Sri Lanka"]
                    );
                    teacherId = teacherRes.insertId;
                }
            } catch (e) { console.error("Error handling teacher profile:", e); throw e; }
        } else {
            console.log("Creating new teacher user...");
            try {
                const hashedTeacherPassword = await bcrypt.hash(teacherPassword, 10);
                const [teacherUserRes] = await db.query(
                    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'TEACHER', 1)",
                    ["Ms. Clara Perera", teacherEmail, hashedTeacherPassword]
                );
                const teacherUserId = teacherUserRes.insertId;

                const [teacherRes] = await db.query(
                    "INSERT INTO teachers (user_id, emp_id, qualification, experience, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
                    [teacherUserId, "EMP001", "B.Ed", "5 Years", "+94 77 111 2222", "Colombo, Sri Lanka"]
                );
                teacherId = teacherRes.insertId;
                console.log("✅ Teacher created.");
            } catch (e) { console.error("Error creating teacher:", e); throw e; }
        }

        // 2. Create Class
        console.log("Step 2: Class");
        let classId;
        try {
            const [existingClasses] = await db.query("SELECT id FROM classes WHERE name = ?", ["Class A"]);
            if (existingClasses.length > 0) {
                console.log("Class A already exists.");
                classId = existingClasses[0].id;
            } else {
                const [classRes] = await db.query(
                    "INSERT INTO classes (name, capacity, teacher_id) VALUES (?, ?, ?)",
                    ["Class A", 25, teacherId]
                );
                classId = classRes.insertId;
                console.log("✅ Class A created and assigned to Teacher.");
            }
            await db.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [teacherId, classId]);
        } catch (e) { console.error("Error handling class:", e); throw e; }

        // 3. Create Child
        console.log("Step 3: Child");
        let childId;
        try {
            const [existingChildren] = await db.query("SELECT id FROM children WHERE first_name = ? AND last_name = ?", ["Shanaya", "Perera"]);
            if (existingChildren.length > 0) {
                console.log("Child Shanaya Perera already exists.");
                childId = existingChildren[0].id;
                await db.query("UPDATE children SET class_id = ? WHERE id = ?", [classId, childId]);
            } else {
                const [childRes] = await db.query(
                    "INSERT INTO children (first_name, last_name, dob, gender, address, medical_conditions, blood_type, enrollment_date, program_name, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    ["Shanaya", "Perera", "2020-05-20", "Female", "Kandy Road, Colombo", "None", "A+", "2024-01-01", "Daycare", classId]
                );
                childId = childRes.insertId;
                console.log("✅ Child 'Shanaya Perera' created and assigned to Class A.");
            }
        } catch (e) { console.error("Error handling child:", e); throw e; }

        // 4. Create Parent
        console.log("Step 4: Parent");
        const parentEmail = "parent@example.com";
        const parentPassword = "Parent12"; // 8 chars
        let parentId;
        try {
            const [existingParentUsers] = await db.query("SELECT id FROM users WHERE email = ?", [parentEmail]);
            if (existingParentUsers.length > 0) {
                console.log("Parent user already exists.");
                const [parentProfiles] = await db.query("SELECT id FROM parents WHERE user_id = ?", [existingParentUsers[0].id]);
                if (parentProfiles.length > 0) {
                    parentId = parentProfiles[0].id;
                } else {
                    const [parentRes] = await db.query(
                        "INSERT INTO parents (user_id, nic, phone, address) VALUES (?, ?, ?, ?)",
                        [existingParentUsers[0].id, "123456789V", "+94 77 123 4567", "Kandy Road, Colombo"]
                    );
                    parentId = parentRes.insertId;
                }
            } else {
                const hashedParentPassword = await bcrypt.hash(parentPassword, 10);
                const [parentUserRes] = await db.query(
                    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'PARENT', 1)",
                    ["Priya Perera", parentEmail, hashedParentPassword]
                );
                const parentUserId = parentUserRes.insertId;

                const [parentRes] = await db.query(
                    "INSERT INTO parents (user_id, nic, phone, address) VALUES (?, ?, ?, ?)",
                    [parentUserId, "123456789V", "+94 77 123 4567", "Kandy Road, Colombo"]
                );
                parentId = parentRes.insertId;
                console.log("✅ Parent created.");
            }
        } catch (e) { console.error("Error handling parent:", e); throw e; }

        // 5. Link Parent to Child
        console.log("Step 5: Link");
        try {
            await db.query(
                "INSERT IGNORE INTO parent_child (parent_id, child_id, relationship) VALUES (?, ?, ?)",
                [parentId, childId, "Mother"]
            );
            console.log("✅ Parent linked to Child.");
        } catch (e) { console.error("Error linking parent/child:", e); throw e; }

        console.log("\n🎉 Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed at an early step.");
        process.exit(1);
    }
}

seedTestData();
