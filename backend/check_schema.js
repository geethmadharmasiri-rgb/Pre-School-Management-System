require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [cols] = await db.query('DESCRIBE payments');
        console.log('PAYMENTS SCHEMA:');
        console.table(cols);
        
        const [rows] = await db.query('SELECT * FROM payments LIMIT 5');
        console.log('SAMPLE DATA:');
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}

checkSchema();
