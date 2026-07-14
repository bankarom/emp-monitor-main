# EmpMonitor Local Development Setup

This guide will help you run the complete EmpMonitor system locally with live employee monitoring data.

## Prerequisites

- ✅ Node.js v24+ installed
- ✅ MySQL running on localhost:3306
- ✅ MongoDB running on localhost:27017
- ✅ Redis running on localhost:6379

## Quick Start

### 1. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS empmonitor;"

# Import schema
mysql -u root -pKalvium@1234 empmonitor < Backend/admin/src/database/empmonitor.sql

# Apply local dev patches
mysql -u root -pKalvium@1234 empmonitor < scripts/local-dev-setup.sql

# Seed test users
cd Backend/admin
set NODE_PATH=node_modules
node ../../scripts/seed-local-users.js
cd ../..
```

### 2. Start Backend Services

Open **3 separate terminals**:

**Terminal 1 - Admin API (port 3000)**
```bash
cd Backend/admin
npm install
npm run start:dev
```

**Terminal 2 - Store Logs API (port 3001)**
```bash
cd Backend/store-logs-api
npm install
npm run start:dev
```

**Terminal 3 - Desktop API (port 3002)** *(optional - for agent auth)*
```bash
cd Backend/desktop
npm install
npm run start:dev
```

### 3. Start Frontend

**Terminal 4 - React Frontend (port 5174)**
```bash
cd Frontend
npm install
npm run dev
```

### 4. Start Agent Emulator (Sends Employee Data)

**Terminal 5 - Agent Emulator**
```bash
node scripts/agent-emulator.js
```

This will:
- Authenticate as `employee@local.test`
- Send activity logs every 5 minutes (app usage, URLs, clicks, keystrokes)
- Upload dummy screenshots
- Send system events (USB, print logs, etc.)

## Login Credentials

| Role | Email | Password | URL |
|------|-------|----------|-----|
| **Admin** | admin@local.test | Admin@1234 | http://localhost:5174/admin-login |
| **Manager** | manager@local.test | Manager@1234 | http://localhost:5174/login |
| **Employee** | employee@local.test | Employee@1234 | http://localhost:5174/employee-login |

## Viewing Data in Admin Panel

After starting the agent emulator, log in as admin and check:

1. **Dashboard** → http://localhost:5174/admin/dashboard
   - Real-time employee activity stats

2. **Employee Details** → http://localhost:5174/admin/employee-details
   - Click on "Employee One" to see detailed activity

3. **Employee Insights** → http://localhost:5174/admin/insights
   - Application usage graphs
   - Website tracking

4. **Live Monitoring** → http://localhost:5174/admin/livemonitoring
   - Real-time screen monitoring (when screenshots are uploaded)

5. **Reports → Web/App Usage** → http://localhost:5174/admin/reports/webappusage
   - Detailed browsing history
   - Application time tracking

6. **DLP → Screenshot Logs** → http://localhost:5174/admin/dlp/screenshotlogs
   - View captured screenshots

7. **DLP → System Logs** → http://localhost:5174/admin/dlp/systemlogs
   - USB insertions, print events, etc.

## Troubleshooting

### "Authentication failed" in agent emulator
- Ensure Store Logs API is running on port 3001
- Check `.env` has `LOCAL_AGENT_AUTH=true`
- Verify `seed-local-users.js` ran successfully

### "No data showing in admin panel"
- Wait 30 seconds after agent emulator starts (first cycle completes)
- Check browser console for errors
- Refresh the admin dashboard
- Check MongoDB is running and connected

### "Cannot connect to database"
- MySQL: `mysql -u root -pKalvium@1234 -e "SHOW DATABASES;"`
- MongoDB: `mongosh --eval "db.version()"`
- Redis: `redis-cli ping` (should return PONG)

### "Port already in use"
- Admin API (3000): `netstat -ano | findstr :3000` → kill the process
- Store Logs (3001): `netstat -ano | findstr :3001` → kill the process
- Frontend (5174): `netstat -ano | findstr :5174` → kill the process

## Architecture

```
┌─────────────────┐
│   Frontend      │  Port 5174 (React + Vite)
│   (Admin Panel) │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
    ┌────▼─────┐   ┌────▼──────────┐
    │ Admin    │   │ Store Logs    │
    │ API      │   │ API           │  
    │ Port 3000│   │ Port 3001     │
    └────┬─────┘   └────▲──────────┘
         │              │
         │         ┌────┴──────────┐
         │         │ Agent         │
         │         │ Emulator      │
         │         │ (simulates    │
         │         │  employee     │
         │         │  desktop)     │
         │         └───────────────┘
         │
    ┌────▼──────────────────┐
    │  MySQL + MongoDB      │
    │  + Redis              │
    └───────────────────────┘
```

## What the Agent Emulator Sends

Every 5 minutes, it sends:

1. **Activity Log** (`/add-activity-log`):
   - Application usage (Chrome, VS Code, etc.)
   - Website URLs visited (YouTube, GitHub, Stack Overflow)
   - Time spent on each app/site
   - Total clicks and keystrokes
   - Active vs idle time

2. **System Events** (`/add-system-log`):
   - USB device insertions/removals
   - Print jobs
   - Screen lock/unlock events

3. **Screenshots** (`/upload-screenshots`):
   - Dummy PNG files with metadata
   - Active window title
   - Mouse and keyboard activity levels

## Next Steps

- Modify `scripts/agent-emulator.js` to change simulated activity
- Add more employees by editing `scripts/seed-local-users.js`
- Check `Backend/admin/.env` → `AUTH_METHOD_V3=true` for local auth bypass
- Explore the Swagger docs at http://localhost:3000/api/v3/explorer

## Support

For issues, check:
- `Backend/admin/src/logger/errorLog/` - backend error logs
- Browser console (F12) - frontend errors
- MongoDB: `use empmonitor; db.activities.find().limit(5)` - verify data is being stored
