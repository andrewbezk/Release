@echo off
cd /d "%~dp0"
if not exist node_modules\electron (
  echo Installing dependencies...
  npm install
)
npm run desktop
