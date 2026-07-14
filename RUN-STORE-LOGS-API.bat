@echo off
title EmpMonitor - Store Logs API (Port 3001)
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main\Backend\store-logs-api"
echo.
echo ==========================================
echo  Store Logs API starting on http://localhost:3001
echo  (receives employee activity data)
echo  Press Ctrl+C to stop
echo ==========================================
echo.
node ..\..\\scripts\store-logs-node24-shim.js
pause
