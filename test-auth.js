const crypto = require('crypto');
const http = require('http');

const CRYPTO_PASSWORD = 'EmpMonitorLocalDevSecretKey12345';
function encryptPassword(text) {
  const IV_LENGTH = 16;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CRYPTO_PASSWORD), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const payload = JSON.stringify({
    email: 'employee1@empmonitor.local',
    password: encryptPassword('123456')
});

const req = http.request('http://localhost:3002/api/v3/auth/authenticate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, (res) => {
    console.log("Status:", res.statusCode);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log("Response:", body));
});
req.write(payload);
req.end();
