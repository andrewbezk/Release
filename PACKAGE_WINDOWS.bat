@echo off
setlocal
cd /d "%~dp0"
echo This script packages Space Expedition as a portable Windows executable.
echo It requires Node.js and internet access for the first dependency installation.
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto fail
)
echo Building and packaging...
call npm run package:win
if errorlevel 1 goto fail
echo.
echo Done. Portable executable is in the release folder.
pause
exit /b 0
:fail
echo Packaging failed. See the output above.
pause
exit /b 1
