@echo off
title EmpMonitor - Agent Emulator (Sends Employee Data)
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main"
echo.
echo ==========================================
echo  Agent Emulator
echo  Simulates employee: employee@local.test
echo  Sends clicks, app usage, URLs, screenshots
echo  to Store Logs API every 5 minutes
echo  Press Ctrl+C to stop
echo ==========================================
echo.

:retry
node scripts\agent-emulator.js
echo.
echo Agent stopped or crashed. Retrying in 5s...
timeout /t 5 >nul
goto retry
