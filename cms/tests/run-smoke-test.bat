@echo off
setlocal
cd /d "%~dp0..\.."
set PHP=C:\xampp\php\php.exe
if not exist "%PHP%" set PHP=php

echo Running CMS Admin Smoke Test...
echo.

"%PHP%" cms\tests\admin-smoke-test.php %*
set ERR=%ERRORLEVEL%

echo.
pause
exit /b %ERR%
