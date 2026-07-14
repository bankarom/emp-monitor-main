@echo off
cd /d "c:\Users\om bankar\Desktop\emp-monitor-main"
echo Writing activity data to admin panel database...
echo.
node scripts\write-activity-to-db.js
echo.
pause
