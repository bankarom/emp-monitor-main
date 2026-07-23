const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kalvium@1234',
    database: 'empmonitor'
  });

  const [rows] = await conn.execute(`
    SELECT employee_id, date, start_time, end_time, activity_type 
    FROM employee_productivity 
    ORDER BY id DESC LIMIT 10
  `);
  console.log(rows);
  await conn.end();
}

run().catch(console.dir);
