@echo off
del result.txt 2>nul
for /R %%f in (*.mjs) do (
  echo File: %%f>>result.txt
  type "%%f">>result.txt
  echo.>>result.txt
)