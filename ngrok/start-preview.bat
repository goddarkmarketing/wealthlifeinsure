@echo off
chcp 65001 >nul
title ngrok Preview — Wealth Life Insure
cd /d "%~dp0"

where ngrok >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] ยังไม่มี ngrok — รัน install-ngrok.bat ก่อน
  pause
  exit /b 1
)

echo.
echo ========================================
echo   ngrok — ส่งลิงก์ให้ลูกค้าดูชั่วคราว
echo ========================================
echo.
echo ก่อนรัน:
echo   [1] XAMPP: Apache + MySQL เปิดอยู่
echo   [2] เปิดได้: http://127.0.0.1/wealthlifeinsure.com/
echo   [3] ใส่ authtoken แล้ว (setup-token.bat)
echo.
echo หลังรัน จะได้ URL แบบ https://xxxx.ngrok-free.app
echo.
echo   หน้าเว็บ:    .../wealthlifeinsure.com/
echo   หลังบ้าน:   .../wealthlifeinsure.com/admin/v2/
echo.
echo ปิดหน้าต่างนี้ = ลิงก์หยุดทำงาน
echo ========================================
echo.

ngrok http 80 --host-header=localhost

pause
