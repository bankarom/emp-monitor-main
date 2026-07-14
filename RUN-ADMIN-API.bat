@echo off
title EmpMonitor - Admin API (Port 3000)
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main\Backend\admin"
echo.
echo ==========================================
echo  Admin API starting on http://localhost:3000
echo  Press Ctrl+C to stop
echo ==========================================
echo.
node adminApi.js
pause
