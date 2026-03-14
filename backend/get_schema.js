require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkSchema() {
    const db = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'Gee2002@dh',
        database: 'preschool_db'
    });

    try {
        const [cols] = await db.query('DESCRIBE payments');
        fs.writeFileSync('schema_output.json', JSON.stringify(cols, null, 2));
        console.log('Schema written to schema_output.json');
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}

checkSchema();
