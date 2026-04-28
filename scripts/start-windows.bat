@echo off
setlocal

set ROOT_DIR=%~dp0..

echo Starting PreLegal...

:: Start backend
cd /d "%ROOT_DIR%\backend"
where uv >nul 2>&1
if errorlevel 1 (
    echo Error: uv is not installed. Install it from https://github.com/astral-sh/uv
    exit /b 1
)

start "PreLegal Backend" /min cmd /c "uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 > %TEMP%\prelegal-backend.log 2>&1"
echo   Backend starting at http://localhost:8001

:: Start frontend
cd /d "%ROOT_DIR%\frontend"
where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed.
    exit /b 1
)

call npm install >nul 2>&1
start "PreLegal Frontend" /min cmd /c "npm run dev > %TEMP%\prelegal-frontend.log 2>&1"
echo   Frontend starting at http://localhost:3000

echo.
echo PreLegal is running.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8001
echo.
echo Close the terminal windows titled "PreLegal Backend" and "PreLegal Frontend" to stop.
