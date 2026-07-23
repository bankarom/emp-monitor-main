@echo off
echo.
echo ========================================
echo   EmpMonitor Local Development Starter
echo ========================================
echo.
echo This will open 5 terminal windows:
echo   1. Admin API (port 3000)
echo   2. Store Logs API (port 3001)
echo   3. Desktop API (port 3002)
echo   4. Frontend (port 5174)
echo   5. Agent Emulator
echo.
echo Press Ctrl+C to stop all services when done.
echo.
pause

cd /d "%~dp0"

echo Starting Admin API...
start "EmpMonitor - Admin API" cmd /k "cd Backend\admin && npm run start:dev"

timeout /t 2 > nul

echo Starting Store Logs API...
start "EmpMonitor - Store Logs API" cmd /k "cd Backend\store-logs-api && npm run start:dev"

timeout /t 2 > nul

echo Starting Desktop API...
start "EmpMonitor - Desktop API" cmd /k "cd Backend\desktop && npm run start:dev"

timeout /t 2 > nul

echo Starting Frontend...
start "EmpMonitor - Frontend" cmd /k "cd Frontend && npm run dev"

echo Starting Productivity Report API...
start "EmpMonitor - Productivity API" cmd /k "cd Backend\productivity_report && npm run start:dev"

timeout /t 2 > nul

echo Starting Cronjobs API...
start "EmpMonitor - Cronjobs API" cmd /k "cd Backend\cronjobs && npm run start:dev"

echo.
echo Waiting 15 seconds for services to start...
timeout /t 15 > nul

echo Starting Agent Emulator...
start "EmpMonitor - Agent Emulator" cmd /k "node scripts\agent-emulator.js"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Admin Panel: http://localhost:5174/admin-login
echo Login: admin@local.test / Admin@1234
echo.
echo Close this window when done (services will keep running)
echo Or close individual terminal windows to stop specific services
echo.
pause
