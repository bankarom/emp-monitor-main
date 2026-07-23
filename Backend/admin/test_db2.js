const mysql = require('mysql2/promise');
const moment = require('moment');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kalvium@1234',
    database: 'empmonitor'
  });

  const from_date = moment().utc().subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
  const to_date = moment().utc().format('YYYY-MM-DD HH:mm:ss');
  
  const query = `
    SELECT
        e.id,
        ea.date,
        ea.end_time
    FROM employees AS e
    LEFT JOIN employee_attendance AS ea ON e.id = ea.employee_id
    WHERE
        e.organization_id = 3 AND
        ea.organization_id = 3 AND
        ea.date = "2026-07-19" AND
        (ea.end_time BETWEEN "${from_date}" AND "${to_date}" OR ea.end_time >= "${to_date}");
  `;
  const [rows] = await conn.execute(query);

  console.log(rows);
  await conn.end();
}

run().catch(console.dir);
