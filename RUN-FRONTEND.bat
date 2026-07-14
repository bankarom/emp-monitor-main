@echo off
title EmpMonitor - Frontend (Port 5174)
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main\Frontend"
echo.
echo ==========================================
echo  Frontend starting on http://localhost:5174
echo  Admin login:    http://localhost:5174/admin-login
echo  Employee login: http://localhost:5174/employee-login
echo  Press Ctrl+C to stop
echo ==========================================
echo.
npx vite --port 5174
pause
