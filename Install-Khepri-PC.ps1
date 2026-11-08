# ============================================================================
# Khepri: Outriders of the Sun - Windows PowerShell PC Installer
# مثبت اللعبة الرسمي لنظام ويندوز (PowerShell)
# ============================================================================

$ErrorActionPreference = "Stop"
$GameDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $GameDir

Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host "   KHEPRI: OUTRIDERS OF THE SUN - PC INSTALLER (Ride Out Heroes Reborn)" -ForegroundColor Cyan
Write-Host "   مثبت اللعبة الرسمي على الحاسوب وإنشاء اختصار سطح المكتب" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[!] لم يتم العثور على Node.js على جهازك!" -ForegroundColor Red
    Write-Host "[!] يرجى تحميل وتثبيت Node.js LTS من الموقع الرسمي: https://nodejs.org" -ForegroundColor Red
    Start-Process "https://nodejs.org"
    Read-Host "اضغط Enter للخروج بعد فتح صفحة التحميل"
    exit 1
}

$nodeVersion = & node -v
Write-Host "[1/4] تم التحقق من بيئة التشغيل Node.js ($nodeVersion)" -ForegroundColor Green

# 2. Install dependencies if missing
if (-not (Test-Path (Join-Path $GameDir "node_modules"))) {
    Write-Host "[2/4] جاري تثبيت ملفات ومكتبات اللعبة لأول مرة (npm install)..." -ForegroundColor Cyan
    & npm install
} else {
    Write-Host "[2/4] مكتبات اللعبة مثبتة وجاهزة (node_modules)." -ForegroundColor Green
}

# 3. Create Desktop & Start Menu Shortcuts
Write-Host "[3/4] جاري إنشاء اختصار اللعبة على سطح المكتب وقائمة ابدأ..." -ForegroundColor Cyan
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Khepri - Outriders of the Sun.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $GameDir "START_GAME_WINDOWS.bat"
$Shortcut.WorkingDirectory = $GameDir
$Shortcut.Description = "Play Khepri: Outriders of the Sun (100-Player Solar Battle Royale)"
$Shortcut.IconLocation = "shell32.dll,13"
$Shortcut.Save()

$ProgramsPath = [Environment]::GetFolderPath("Programs")
$StartMenuShortcutPath = Join-Path $ProgramsPath "Khepri - Outriders of the Sun.lnk"
$SmShortcut = $WshShell.CreateShortcut($StartMenuShortcutPath)
$SmShortcut.TargetPath = Join-Path $GameDir "START_GAME_WINDOWS.bat"
$SmShortcut.WorkingDirectory = $GameDir
$SmShortcut.Description = "Play Khepri: Outriders of the Sun (100-Player Solar Battle Royale)"
$SmShortcut.IconLocation = "shell32.dll,13"
$SmShortcut.Save()

Write-Host "      تم إنشاء أيقونة 'Khepri - Outriders of the Sun' على سطح المكتب بنجاح!" -ForegroundColor Green

# 4. Launch Game in Standalone App Mode
Write-Host "[4/4] جاري تشغيل اللعبة في نافذة تطبيق سطح مكتب مستقلة..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    try {
        Start-Process "msedge" -ArgumentList "--app=http://localhost:3000 --start-maximized" -ErrorAction Stop
    } catch {
        try {
            Start-Process "chrome" -ArgumentList "--app=http://localhost:3000 --start-maximized" -ErrorAction Stop
        } catch {
            Start-Process "http://localhost:3000"
        }
    }
} | Out-Null

& npm run dev
