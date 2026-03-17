@echo off
setlocal
cd /d "%~dp0"

echo(
echo === TG Text RPG bot stopper ===
echo This will stop node/nodemon processes related to this project.
echo Dir: "%cd%"
echo Time: %date% %time%
echo(

if /i "%~1"=="all" goto kill_all

rem Try to stop node processes running bot.mjs from this folder
set "FOUND=0"
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command ^
  "$dir=(Get-Location).Path; " ^
  "$procs=Get-CimInstance Win32_Process | Where-Object { " ^
  "  ($_.Name -in @('node.exe','nodemon.exe')) -and " ^
  "  ($_.CommandLine -match 'bot\.mjs') -and " ^
  "  ($_.CommandLine -like ('*' + $dir + '*'))" ^
  "}; " ^
  "$procs | ForEach-Object { $_.ProcessId }"`) do (
  set "FOUND=1"
  echo Killing PID %%p ...
  taskkill /PID %%p /T /F >nul 2>nul
)

if "%FOUND%"=="0" (
  echo No matching bot processes found for this folder.
  echo If the bot was started elsewhere, run this script in that folder.
)

goto done

:kill_all
echo Killing ALL Node.js processes (node.exe)...
taskkill /F /IM node.exe >nul 2>nul
echo Killing ALL nodemon processes (nodemon.exe)...
taskkill /F /IM nodemon.exe >nul 2>nul

:done
echo(
echo Done.
echo(
pause
endlocal
