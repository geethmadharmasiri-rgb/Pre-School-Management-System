const db = require("./db");

async function checkTeacherClass() {
    try {
        // 1. Get all teachers
        const [teachers] = await db.query(`
      SELECT t.id, u.name, u.email 
      FROM teachers t 
      JOIN users u ON t.user_id = u.id
    `);
        console.log("Teachers:", teachers);

        // 2. Get all classes
        const [classes] = await db.query(`
      SELECT c.id, c.name, c.teacher_id, c.academic_year_id, ay.year_name, ay.is_active
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
    `);
        console.log("Classes:", classes);

        // 3. Get all academic years
        const [years] = await db.query("SELECT * FROM academic_years");
        console.log("Academic Years:", years);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkTeacherClass();
