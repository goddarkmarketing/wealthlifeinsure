@echo off
chcp 65001 >nul
title ตั้งค่า ngrok Authtoken
cd /d "%~dp0"

where ngrok >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] ยังไม่มี ngrok — รัน install-ngrok.bat ก่อน
  pause
  exit /b 1
)

echo.
echo === ตั้งค่า Authtoken (ครั้งเดียว) ===
echo.
echo 1. สมัคร / เข้า https://dashboard.ngrok.com/
echo 2. คัดลอก Authtoken จากหน้า Your Authtoken
echo.
set /p TOKEN="วาง Authtoken แล้วกด Enter: "

if "%TOKEN%"=="" (
  echo [ERROR] ยังไม่ได้วาง token
  pause
  exit /b 1
)

ngrok config add-authtoken %TOKEN%
echo.
echo ตั้งค่าเสร็จ — รัน start-preview.bat ได้เลย
pause
