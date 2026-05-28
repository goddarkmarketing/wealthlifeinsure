@echo off
chcp 65001 >nul
title เข้าสู่ระบบ Cloudflare (tunnel)
cd /d "%~dp0"

where cloudflared >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] รัน install-cloudflared.bat ก่อน
  pause
  exit /b 1
)

echo เปิดเบราว์เซอร์ให้ล็อกอิน Cloudflare แล้วเลือกโดเมน...
cloudflared tunnel login
pause
