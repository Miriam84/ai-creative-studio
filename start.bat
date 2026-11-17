@echo off
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
    echo [ERROR] Python no esta instalat. Si us plau, instal-la Python 3.10+ per continuar.
    pause
    exit /b 1
)

echo [1/3] Preparant el Backend (FastAPI)...
cd backend
if not exist venv (
    echo Creant entorn virtual Python (venv)...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo [2/3] Iniciant el servidor Backend a http://localhost:8000...
start "OmniStudio Backend" cmd /k "venv\Scripts\activate && python main.py"

echo [3/3] Iniciant el Frontend (Vite + React) a http://localhost:5173...
cd ..\frontend
if not exist node_modules (
    echo Instal-lant dependencies de Node.js...
    call npm install
)
start "OmniStudio Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Tot a punt! Obre el navegador a:
echo   -> http://localhost:5173
echo ========================================================
echo.
pause
