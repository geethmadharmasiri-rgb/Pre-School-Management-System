const db = require("./db");

async function initDB() {
    try {
        console.log("🔄 Initializing/Updating Database Schema...");

        // 1. Children Table (3NF: Health details moved to child_health)
        await db.query(`
            CREATE TABLE IF NOT EXISTS children (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                dob DATE NOT NULL,
                gender ENUM('Male', 'Female') DEFAULT 'Male',
                address TEXT,
                enrollment_date DATE,
                program_name VARCHAR(100),
                class_id INT,
                qr_code VARCHAR(255) UNIQUE,
                birth_certificate VARCHAR(255),
                profile_picture VARCHAR(255),
                academic_year_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add missing columns to children if they don't exist
        const [childCols] = await db.query("SHOW COLUMNS FROM children");
        const childColNames = childCols.map(c => c.Field);
        if (!childColNames.includes('address')) await db.query("ALTER TABLE children ADD COLUMN address TEXT");
        if (!childColNames.includes('program_name')) await db.query("ALTER TABLE children ADD COLUMN program_name VARCHAR(100)");
        if (!childColNames.includes('qr_code')) await db.query("ALTER TABLE children ADD COLUMN qr_code VARCHAR(255) UNIQUE");
        if (!childColNames.includes('birth_certificate')) await db.query("ALTER TABLE children ADD COLUMN birth_certificate VARCHAR(255)");
        if (!childColNames.includes('profile_picture')) await db.query("ALTER TABLE children ADD COLUMN profile_picture VARCHAR(255)");
        if (!childColNames.includes('academic_year_id')) await db.query("ALTER TABLE children ADD COLUMN academic_year_id INT");

        // 2. Teachers Table (Standardized contact -> phone)
        await db.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                emp_id VARCHAR(50) UNIQUE NOT NULL,
                nic VARCHAR(20) UNIQUE,
                qualification TEXT,
                experience VARCHAR(100),
                contact VARCHAR(20),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check for contact column in teachers
        const [teacherCols] = await db.query("SHOW COLUMNS FROM teachers");
        const teacherColNames = teacherCols.map(c => c.Field);
        if (!teacherColNames.includes('contact')) {
            // Check if 'phone' exists instead (from previous attempt) and rename or add
            if (teacherColNames.includes('phone')) {
                await db.query("ALTER TABLE teachers CHANGE COLUMN phone contact VARCHAR(20)");
            } else {
                await db.query("ALTER TABLE teachers ADD COLUMN contact VARCHAR(20)");
            }
        }

        // 3. Academic Years Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year_name VARCHAR(20) NOT NULL,
                is_active TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Classes Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                capacity INT DEFAULT 25,
                teacher_id INT,
                academic_year_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
                FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
            )
        `);

        // Ensure academic_year_id exists in classes
        const [classCols] = await db.query("SHOW COLUMNS FROM classes");
        const classColNames = classCols.map(c => c.Field);
        if (!classColNames.includes('academic_year_id')) {
            await db.query("ALTER TABLE classes ADD COLUMN academic_year_id INT");
            try {
                await db.query("ALTER TABLE classes ADD CONSTRAINT fk_classes_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL");
            } catch (fkErr) {
                if (fkErr.code !== 'ER_DUP_CONSTRAINT_NAME') throw fkErr;
                console.log("ℹ️ Foreign key constraint already exists.");
            }
        }


        // 5. Parents Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS parents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                nic VARCHAR(20) UNIQUE,
                phone VARCHAR(20),
                address TEXT,
                occupation VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Ensure occupation exists in parents
        const [parentCols] = await db.query("SHOW COLUMNS FROM parents");
        const parentColNames = parentCols.map(c => c.Field);
        if (!parentColNames.includes('occupation')) {
            await db.query("ALTER TABLE parents ADD COLUMN occupation VARCHAR(100)");
        }
        if (!parentColNames.includes('phone')) {
            await db.query("ALTER TABLE parents ADD COLUMN phone VARCHAR(20)");
        }

        // 6. Parent-Child Junction
        await db.query(`
            CREATE TABLE IF NOT EXISTS parent_child (
                parent_id INT NOT NULL,
                child_id INT NOT NULL,
                relationship VARCHAR(50), 
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                PRIMARY KEY (parent_id, child_id),
                FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
            )
        `);

        // 7. OTPs Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS otps (
                email VARCHAR(255) PRIMARY KEY,
                otp VARCHAR(10) NOT NULL,
                role VARCHAR(20) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 8. Attendance Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                child_id INT NOT NULL,
                date DATE NOT NULL,
                status ENUM('Present', 'Absent', 'Late') NOT NULL,
                check_in_time TIME,
                marked_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
                FOREIGN KEY (marked_by) REFERENCES teachers(id) ON DELETE SET NULL,
                UNIQUE KEY unique_attendance_per_day (child_id, date)
            )
        `);

        // 9. Events Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time TIME,
                location VARCHAR(255),
                status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 10. Event Gallery
        await db.query(`
            CREATE TABLE IF NOT EXISTS event_gallery (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `);

        // 11. Notifications Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(100), 
                audience VARCHAR(100) DEFAULT 'Global',
                message TEXT NOT NULL,
                target_user_id INT NULL,
                target_class_id INT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 12. Child Health Table (3NF: Separated from children)
        await db.query(`
            CREATE TABLE IF NOT EXISTS child_health (
                child_id INT PRIMARY KEY,
                blood_type VARCHAR(10),
                allergies TEXT,
                medications TEXT,
                health_notes TEXT,
                medical_conditions TEXT,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
            )
        `);

        // 13. Homework Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS homework (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                file_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            )
        `);

        // Ensure file_path exists in homework
        const [hwCols] = await db.query("SHOW COLUMNS FROM homework");
        const hwColNames = hwCols.map(c => c.Field);
        if (!hwColNames.includes('file_path')) {
            await db.query("ALTER TABLE homework ADD COLUMN file_path VARCHAR(255)");
        }

        // 14. Meal Plans Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS meal_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                meal_type ENUM('Breakfast', 'Lunch', 'Snack'),
                menu TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 15. Behavior Reports Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS behavior_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                child_id INT NOT NULL,
                teacher_id INT NOT NULL,
                date DATE NOT NULL,
                rating INT,
                category VARCHAR(100),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
            )
        `);

        // 16. Payments Table (Summary of Payment Management)
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                parent_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('Cash', 'Bank Transfer', 'Card', 'Online') NOT NULL,
                status ENUM('Paid', 'Pending', 'Overdue') DEFAULT 'Pending',
                receipt_number VARCHAR(50) UNIQUE,
                child_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
            )
        `);


        console.log("🎉 Database schema synchronization complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database initialization failed:", err);
        process.exit(1);
    }
}

initDB();

