@echo off
setlocal
cd /d "%~dp0"

rem Quick launcher for Windows.
rem Usage:
rem   start_bot.bat        -> npm run dev
rem   start_bot.bat dev    -> npm run dev
rem   start_bot.bat run    -> node bot.mjs

set "MODE=%~1"

if /i "%MODE%"=="run" goto run
goto dev

:dev
call npm run dev
goto end

:run
node bot.mjs
goto end

:end
endlocal
