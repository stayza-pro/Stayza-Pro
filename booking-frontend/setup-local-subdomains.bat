@echo off
REM Local Subdomain Testing Setup Script for Windows
REM Run as Administrator

echo ================================
echo Multi-Tenant Subdomain Setup
echo ================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo.
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

set HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts

echo Hosts file location: %HOSTS_FILE%
echo.

echo Subdomains to add:
echo   - anderson-properties.localhost
echo   - john-realtor.localhost
echo   - test-realtor.localhost
echo.

echo WARNING: This will modify your hosts file
echo.
set /p CONFIRM="Continue? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Aborted.
    pause
    exit /b 0
)

echo.
echo Creating backup...
copy "%HOSTS_FILE%" "%HOSTS_FILE%.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
echo Backup created
echo.

echo Adding subdomain entries...
echo.

REM Add entries
findstr /C:"127.0.0.1 anderson-properties.localhost" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo 127.0.0.1 anderson-properties.localhost >> "%HOSTS_FILE%"
    echo Added anderson-properties.localhost
) else (
    echo anderson-properties.localhost already exists
)

findstr /C:"127.0.0.1 john-realtor.localhost" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo 127.0.0.1 john-realtor.localhost >> "%HOSTS_FILE%"
    echo Added john-realtor.localhost
) else (
    echo john-realtor.localhost already exists
)

findstr /C:"127.0.0.1 test-realtor.localhost" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo 127.0.0.1 test-realtor.localhost >> "%HOSTS_FILE%"
    echo Added test-realtor.localhost
) else (
    echo test-realtor.localhost already exists
)

echo.
echo Flushing DNS cache...
ipconfig /flushdns
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo You can now access:
echo   - http://anderson-properties.localhost:3000
echo   - http://john-realtor.localhost:3000
echo   - http://test-realtor.localhost:3000
echo.
echo Next steps:
echo   1. Start backend: cd booking-backend ^&^& npm run dev
echo   2. Start frontend: cd booking-frontend ^&^& npm run dev
echo   3. Visit any subdomain URL above
echo.
echo Troubleshooting:
echo   - If subdomain doesn't work, restart your browser
echo   - Check middleware logs in terminal
echo   - Verify hosts file: type %HOSTS_FILE%
echo.

pause
