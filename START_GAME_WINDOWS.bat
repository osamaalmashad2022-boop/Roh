@echo off
chcp 65001 >nul
title Khepri: Outriders of the Sun - Local PC Game Server
color 0E

cd /d "%~dp0"

echo ============================================================================
echo    KHEPRI: OUTRIDERS OF THE SUN (100-Player Solar Battle Royale)
echo    تشغيل اللعبة على الكمبيوتر - Starting Local Game Engine...
echo ============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [!] يرجى تثبيت برنامج Node.js LTS أولاً من الرابط: https://nodejs.org
    echo [!] Please install Node.js LTS from https://nodejs.org first.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [*] تثبيت مكتبات اللعبة لأول مرة (npm install)...
    call npm install
)

echo [*] جاري تشغيل خادم اللعبة المحلي وفتح نافذة سطح المكتب المستقلة...
echo [*] Opening Standalone Desktop Window at http://localhost:3000 ...
start "" cmd /c "timeout /t 3 >nul & (start msedge --app=http://localhost:3000 --start-maximized 2>nul || start chrome --app=http://localhost:3000 --start-maximized 2>nul || start http://localhost:3000)"
call npm run dev
pause
