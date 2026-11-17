@echo off
setlocal EnableDelayedExpansion
title OmniStudio - AI Creative Suite Launcher

echo ========================================================
echo   OmniStudio: Magnific + Higgsfield + ElevenLabs Suite
echo ========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalat. Si us plau, instal-la Node.js per continuar.
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalat. Si us plau, instal-la Python per continuar.
    pause
    exit /b 1
)

:: Ensure we are at project root
cd /d "%~dp0"

echo [1/3] Preparant el Backend FastAPI...
cd backend
if not exist venv (
    echo Creant entorn virtual Python venv...
    python -m venv venv
)

echo Activant entorn virtual i instal-lant llibreries...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

echo.
echo [2/3] Iniciant el servidor Backend a http://localhost:8001...
start "OmniStudio Backend" cmd /k "cd /d ""%~dp0backend"" && call venv\Scripts\activate.bat && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

echo.
echo [3/3] Iniciant el Frontend a http://localhost:5173...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Instal-lant dependencies de Node.js...
    call npm install
)

start "OmniStudio Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ========================================================
echo   Tot a punt! Obre el navegador a:
echo   --^> http://localhost:5173
echo ========================================================
echo.
pause
