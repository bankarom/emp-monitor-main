const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const script = `
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'Kalvium@1234',
      database: 'empmonitor'
    });
    const hash = await bcrypt.hash('Improx#admin@improx.com', 10);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@improx.com']);
    console.log('Password reset to Improx#admin@improx.com for users table. Rows affected: ' + result.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
`;

  conn.exec(`mkdir -p /tmp/reset-env && cd /tmp/reset-env && cat << 'EOF' > reset.js\n${script}\nEOF\nnpm init -y > /dev/null && npm i bcryptjs mysql2 && node reset.js`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '200.141.2.53',
  port: 22,
  username: 'root',
  password: 'Ashutosh26@improxgroup.com'
});
