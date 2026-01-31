@echo off
echo ========================================================
echo           FOAMAPP PRO - LOCAL SERVER SETUP
echo ========================================================
echo.
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo.
echo 1. Installing dependencies (this may take a few minutes)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b
)

echo.
echo 2. Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

echo.
echo ========================================================
echo           SETUP COMPLETE!
echo ========================================================
echo You can now run 'run_app.bat' to start the server.
echo.
pause
