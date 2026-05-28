@echo off
chcp 65001 >nul
title ติดตั้ง Cloudflare cloudflared
echo.
echo === ติดตั้ง cloudflared (ครั้งแรก) ===
echo.

where cloudflared >nul 2>&1
if %ERRORLEVEL%==0 (
  echo พบ cloudflared แล้ว:
  cloudflared --version
  echo.
  pause
  exit /b 0
)

echo กำลังติดตั้งผ่าน winget...
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements

if %ERRORLEVEL% neq 0 (
  echo.
  echo ติดตั้งไม่สำเร็จ — ดาวน์โหลดเองได้ที่:
  echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  pause
  exit /b 1
)

echo.
echo ติดตั้งเสร็จ — ปิดหน้าต่างนี้แล้วเปิด CMD ใหม่
echo จากนั้นรัน quick-tunnel.bat
echo.
pause
