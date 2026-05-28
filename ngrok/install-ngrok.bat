@echo off
chcp 65001 >nul
title ติดตั้ง ngrok
echo.
echo === ติดตั้ง ngrok ===
echo.

where ngrok >nul 2>&1
if %ERRORLEVEL%==0 (
  echo พบ ngrok แล้ว:
  ngrok version
  echo.
  echo ขั้นถัดไป: รัน setup-token.bat แล้ว start-preview.bat
  pause
  exit /b 0
)

echo กำลังติดตั้งผ่าน winget...
winget install --id Ngrok.Ngrok -e --accept-source-agreements --accept-package-agreements

if %ERRORLEVEL% neq 0 (
  echo.
  echo ติดตั้งไม่สำเร็จ — ดาวน์โหลดได้ที่ https://ngrok.com/download
  pause
  exit /b 1
)

echo.
echo ติดตั้งเสร็จ — ปิดหน้าต่างนี้ เปิด CMD ใหม่
echo จากนั้นรัน setup-token.bat แล้ว start-preview.bat
echo.
pause
