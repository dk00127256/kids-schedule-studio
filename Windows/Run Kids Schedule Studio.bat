@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "POWERSHELL_SCRIPT=%SCRIPT_DIR%Run Kids Schedule Studio.ps1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%POWERSHELL_SCRIPT%"

if errorlevel 1 (
  echo.
  echo Kids Schedule Studio could not start.
  pause
)
