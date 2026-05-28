@echo off
chcp 65001 >nul
title Cloudflare Named Tunnel — Wealth Life Insure
cd /d "%~dp0"

where cloudflared >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] ยังไม่มี cloudflared — รัน install-cloudflared.bat ก่อน
  pause
  exit /b 1
)

if not exist "config.yml" (
  echo [ERROR] ไม่พบ config.yml
  echo คัดลอกจาก config.example.yml แล้วตั้งค่าตาม README.md
  pause
  exit /b 1
)

echo.
echo === Named Tunnel ===
echo ใช้ config.yml ในโฟลเดอร์นี้
echo ปิดหน้าต่างนี้ = tunnel หยุด
echo.
echo ----------------------------------------
echo.

cloudflared tunnel --config config.yml run

pause
