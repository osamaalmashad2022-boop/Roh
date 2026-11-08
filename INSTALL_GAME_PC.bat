@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Khepri: Outriders of the Sun - Official PC Installer (Ride Out Heroes Reborn)
color 0E

echo ============================================================================
echo    KHEPRI: OUTRIDERS OF THE SUN (Ride Out Heroes - 100-Player Solar Royale)
echo    مثبت اللعبة الرسمي على الكمبيوتر - Official Windows PC Setup Wizard
echo ============================================================================
echo.

cd /d "%~dp0"
set "GAME_DIR=%~dp0"
if "%GAME_DIR:~-1%"=="\" set "GAME_DIR=%GAME_DIR:~0,-1%"

echo [1/4] Checking Node.js runtime environment... (فحص بيئة التشغيل)
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [!] Node.js is not installed on this PC!
    echo [!] يرجى تثبيت برنامج Node.js LTS أولاً لتشغيل محرك اللعبة محلياً:
    echo     https://nodejs.org/
    echo.
    choice /C YN /M "Do you want to open https://nodejs.org now to download it? (Y/N)"
    if !errorlevel! equ 1 start https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo     [OK] Node.js detected: %NODE_VER%
echo.

echo [2/4] Installing / Verifying game packages... (تثبيت ملفات ومكتبات اللعبة)
if not exist "%GAME_DIR%\node_modules" (
    echo     [*] Running npm install for first-time setup...
    call npm install
    if !errorlevel! neq 0 (
        color 0C
        echo     [!] Failed to install dependencies. Please check your internet connection.
        pause
        exit /b 1
    )
) else (
    echo     [OK] Game dependencies already installed in node_modules.
)
echo.

echo [3/4] Creating Windows Desktop & Start Menu Shortcuts... (إنشاء اختصار اللعبة على سطح المكتب)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); ^
   $wsh = New-Object -ComObject WScript.Shell; ^
   $shortcut = $wsh.CreateShortcut((Join-Path $desktop 'Khepri - Outriders of the Sun.lnk')); ^
   $shortcut.TargetPath = '%GAME_DIR%\START_GAME_WINDOWS.bat'; ^
   $shortcut.WorkingDirectory = '%GAME_DIR%'; ^
   $shortcut.Description = 'Launch Khepri: Outriders of the Sun (100-Player Battle Royale)'; ^
   $shortcut.IconLocation = 'shell32.dll,13'; ^
   $shortcut.Save(); ^
   $startMenu = [Environment]::GetFolderPath('Programs'); ^
   $smShortcut = $wsh.CreateShortcut((Join-Path $startMenu 'Khepri - Outriders of the Sun.lnk')); ^
   $smShortcut.TargetPath = '%GAME_DIR%\START_GAME_WINDOWS.bat'; ^
   $smShortcut.WorkingDirectory = '%GAME_DIR%'; ^
   $smShortcut.Description = 'Launch Khepri: Outriders of the Sun (100-Player Battle Royale)'; ^
   $smShortcut.IconLocation = 'shell32.dll,13'; ^
   $smShortcut.Save();" >nul 2>nul

if %errorlevel% equ 0 (
    echo     [OK] Shortcut "Khepri - Outriders of the Sun" created on your Desktop and Start Menu!
    echo     [OK] تم إنشاء أيقونة تشغيل اللعبة على سطح المكتب وقائمة ابدأ بنجاح!
) else (
    echo     [*] Creating fallback Desktop batch launcher...
    (
        echo @echo off
        echo cd /d "%GAME_DIR%"
        echo call "%GAME_DIR%\START_GAME_WINDOWS.bat"
    ) > "%USERPROFILE%\Desktop\Play Khepri - Outriders of the Sun.bat"
    echo     [OK] Desktop launcher created on Desktop!
)
echo.

echo [4/4] Building & Launching Khepri: Outriders of the Sun in Standalone Desktop Mode...
echo ============================================================================
echo    تم التثبيت بنجاح! سيتم الآن فتح اللعبة في نافذة سطح مكتب مستقلة.
echo    يمكنك في أي وقت تشغيل اللعبة من أيقونة سطح المكتب:
echo    "Khepri - Outriders of the Sun"
echo ============================================================================
echo.

start "" cmd /c "timeout /t 3 >nul & (start msedge --app=http://localhost:3000 --start-maximized 2>nul || start chrome --app=http://localhost:3000 --start-maximized 2>nul || start http://localhost:3000)"
call npm run dev
pause
