const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kalvium@1234',
    database: 'empmonitor'
  });

  const [rows] = await conn.execute(`
    SELECT employee_id, date, start_time, end_time, NOW() as current_db_time, UTC_TIMESTAMP() as utc_db_time
    FROM employee_attendance 
    ORDER BY id DESC LIMIT 10
  `);
  console.log(rows);
  await conn.end();
}

run().catch(console.dir);
