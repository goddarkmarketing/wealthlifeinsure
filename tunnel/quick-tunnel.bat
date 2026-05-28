@echo off
chcp 65001 >nul
title Cloudflare Quick Tunnel — Wealth Life Insure
cd /d "%~dp0"

where cloudflared >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] ยังไม่มี cloudflared — รัน install-cloudflared.bat ก่อน
  pause
  exit /b 1
)

echo.
echo === Quick Tunnel (trycloudflare.com) ===
echo.
echo ตรวจสอบก่อนรัน:
echo   [1] XAMPP Apache + MySQL เปิดอยู่
echo   [2] เปิดได้: http://localhost/wealthlifeinsure.com
echo.
echo ลิงก์ด้านล่างส่งให้ลูกค้าได้ (ปิดหน้าต่างนี้ = tunnel หยุด)
echo หลังบ้าน: ต่อท้าย URL ด้วย /admin/v2/
echo.
echo ----------------------------------------
echo.

cloudflared tunnel --url http://127.0.0.1/wealthlifeinsure.com

pause
