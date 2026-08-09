@echo off
setlocal EnableExtensions
title Smart School ERP Launcher

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_PORT=8001"
set "FRONTEND_PORT=5173"
set "PHP_BIN=C:\php83\php.exe"
set "URL=http://localhost:%FRONTEND_PORT%"

echo [smart-school-erp] Checking backend (port %BACKEND_PORT%)...
call :isPortOpen %BACKEND_PORT%
if "%PORT_OPEN%"=="1" (
    echo [smart-school-erp] Backend already running - skipping.
) else (
    echo [smart-school-erp] Starting backend in the background...
    start "smart-school-erp-backend" /min cmd /c "cd /d "%BACKEND_DIR%" && "%PHP_BIN%" artisan serve --host=127.0.0.1 --port=%BACKEND_PORT%"
)

echo [smart-school-erp] Checking frontend (port %FRONTEND_PORT%)...
call :isPortOpen %FRONTEND_PORT%
if "%PORT_OPEN%"=="1" (
    echo [smart-school-erp] Frontend already running - skipping.
) else (
    echo [smart-school-erp] Starting frontend in the background...
    start "smart-school-erp-frontend" /min cmd /c "cd /d "%FRONTEND_DIR%" && npm run dev"
)

echo [smart-school-erp] Waiting for backend to become ready...
call :waitForPort %BACKEND_PORT%
if errorlevel 1 goto :fail

echo [smart-school-erp] Waiting for frontend to become ready...
call :waitForPort %FRONTEND_PORT%
if errorlevel 1 goto :fail

echo [smart-school-erp] Opening %URL% ...
start "" "%URL%"
exit /b 0

:fail
echo [smart-school-erp] Timed out waiting for a server to become ready.
echo Check the minimized "smart-school-erp-backend" / "smart-school-erp-frontend" windows for errors.
pause
exit /b 1

:isPortOpen
set "PORT_OPEN=0"
powershell -NoProfile -Command "$c = New-Object System.Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', %1); if ($c.Connected) { exit 0 } else { exit 1 } } catch { exit 1 } finally { $c.Close() }" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "PORT_OPEN=1"
exit /b 0

:waitForPort
set "TRIES=0"
:waitLoopBody
call :isPortOpen %1
if "%PORT_OPEN%"=="1" exit /b 0
set /a TRIES+=1
if %TRIES% GEQ 120 exit /b 1
powershell -NoProfile -Command "Start-Sleep -Milliseconds 500" >nul
goto :waitLoopBody
