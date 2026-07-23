const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const pool = mysql.createPool({
      host: '200.141.2.53',
      user: 'root',
      password: 'Kalvium@1234',
      database: 'empmonitor'
    });
    
    // Hash the password Improx#admin@improx.com
    const hash = await bcrypt.hash('Improx#admin@improx.com', 10);
    
    const [result] = await pool.query('UPDATE organizations SET password = ? WHERE email = ?', [hash, 'admin@improx.com']);
    
    console.log(`Password reset to Improx#admin@improx.com. Rows affected: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
