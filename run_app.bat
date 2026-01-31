@echo off
echo ========================================================
echo           FOAMAPP PRO - STARTING LOCAL SERVER
echo ========================================================
echo.
echo Server starting at http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.
echo Opening browser...
timeout /t 3 >nul
start http://localhost:3000

echo Starting static file server...
call npx serve -s dist -l 3000
