@echo off
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main"
echo Patching database...
node scripts\patch-db.js
echo.
echo Done! Press any key to close.
pause
