/**
 * Seed fresh employees for EmpMonitor local testing.
 * 
 * Usage: node scripts/seed-local-users.js
 * 
 * This calls the Admin API's /api/v3/users/sync endpoint to create users
 * with properly encrypted passwords in MySQL.
 * 
 * Prerequisites: Admin API must be running on port 3000
 */

const http = require('http');
const crypto = require('crypto');

const ADMIN_API = 'http://localhost:3000';
const CRYPTO_PASSWORD = 'EmpMonitorLocalDevSecretKey12345';

function encrypt(text, key) {
    const IV_LENGTH = 16;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Fresh employees to create
const employees = [
    {
        empcloud_user_id: 1001,
        organization_id: 1,
        email: 'admin@empmonitor.local',
        first_name: 'Admin',
        last_name: 'User',
        emp_code: 'ADM001',
        role: 'Admin',
        password: 'Admin@1234'
    },
    {
        empcloud_user_id: 1002,
        organization_id: 1,
        email: 'employee1@empmonitor.local',
        first_name: 'Employee',
        last_name: 'One',
        emp_code: 'EMP001',
        role: 'Employee',
        password: '123456'
    },
    {
        empcloud_user_id: 1003,
        organization_id: 1,
        email: 'employee2@empmonitor.local',
        first_name: 'Employee',
        last_name: 'Two',
        emp_code: 'EMP002',
        role: 'Employee',
        password: '123456'
    },
    {
        empcloud_user_id: 1004,
        organization_id: 1,
        email: 'employee3@empmonitor.local',
        first_name: 'Employee',
        last_name: 'Three',
        emp_code: 'EMP003',
        role: 'Employee',
        password: '123456'
    },
    {
        empcloud_user_id: 1005,
        organization_id: 1,
        email: 'employee4@empmonitor.local',
        first_name: 'Employee',
        last_name: 'Four',
        emp_code: 'EMP004',
        role: 'Employee',
        password: '123456'
    }
];

async function syncUser(user) {
    const payload = {
        ...user,
        password: user.password
    };
    
    const data = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const url = new URL(`${ADMIN_API}/api/v3/users/sync`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, ...result });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=== EmpMonitor Employee Seeder ===');
    console.log(`Target: ${ADMIN_API}/api/v3/users/sync`);
    console.log('');

    for (const emp of employees) {
        try {
            console.log(`Creating: ${emp.email} (${emp.first_name} ${emp.last_name}, ${emp.role})...`);
            const result = await syncUser(emp);
            if (result.status === 200 || result.status === 201) {
                console.log(`  ✅ Success: ${JSON.stringify(result.message || result)}`);
            } else {
                console.log(`  ⚠️  Status ${result.status}: ${JSON.stringify(result.message || result)}`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
            if (err.code === 'ECONNREFUSED') {
                console.log('  → Admin API is not running. Start it first: cd Backend/admin && npm run start:dev');
                process.exit(1);
            }
        }
    }

    console.log('');
    console.log('=== Done ===');
    console.log('');
    console.log('Login credentials:');
    console.log('┌─────────────────────────────────┬──────────────┬──────────┐');
    console.log('│ Email                           │ Password     │ Role     │');
    console.log('├─────────────────────────────────┼──────────────┼──────────┤');
    for (const emp of employees) {
        const email = emp.email.padEnd(31);
        const pwd = emp.password.padEnd(12);
        const role = emp.role.padEnd(8);
        console.log(`│ ${email} │ ${pwd} │ ${role} │`);
    }
    console.log('└─────────────────────────────────┴──────────────┴──────────┘');
}

main().catch(console.error);
