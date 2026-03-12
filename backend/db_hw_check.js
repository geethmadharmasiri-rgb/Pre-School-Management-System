const db = require("./db");

async function check() {
    const [years] = await db.query("SELECT * FROM academic_years");
    console.log("--- ACADEMIC YEARS ---");
    console.log(JSON.stringify(years, null, 2));

    const [classes] = await db.query(`
    SELECT c.id, c.name, c.teacher_id, c.academic_year_id, t.id as teacherId, u.name as teacherName
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
  `);
    console.log("--- CLASSES ---");
    console.log(JSON.stringify(classes, null, 2));
    process.exit(0);
}

check();
