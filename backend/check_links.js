const mysql = require('mysql2/promise');

async function checkLinks() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Gee2002@dh',
        database: 'preschool_db',
        port: 3307
    });

    try {
        let output = "";
        output += "--- parent_child links ---\n";
        const [links] = await connection.query(`
            SELECT pc.parent_id, pc.child_id, pc.relationship, pc.status, 
                   c.first_name as child_name, u.name as parent_user_name, u.email as parent_email, p.nic
            FROM parent_child pc
            JOIN children c ON pc.child_id = c.id
            JOIN parents p ON pc.parent_id = p.id
            JOIN users u ON p.user_id = u.id
        `);
        output += JSON.stringify(links, null, 2) + "\n\n";

        output += "--- children ---\n";
        const [children] = await connection.query("SELECT id, first_name, last_name FROM children");
        output += JSON.stringify(children, null, 2) + "\n\n";

        output += "--- parents ---\n";
        const [parents] = await connection.query("SELECT p.id, u.name, u.email, p.nic, p.user_id FROM parents p JOIN users u ON p.user_id = u.id");
        output += JSON.stringify(parents, null, 2) + "\n\n";

        output += "--- users ---\n";
        const [users] = await connection.query("SELECT id, name, email, role FROM users");
        output += JSON.stringify(users, null, 2) + "\n\n";

        require('fs').writeFileSync('debug_output.txt', output);
        console.log("Done. Results in debug_output.txt");

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkLinks();
