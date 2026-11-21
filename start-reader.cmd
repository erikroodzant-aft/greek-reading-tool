@echo off
cd /d "%~dp0"
if not exist "index.html" goto incomplete
if not exist "reader.html" goto incomplete
if not exist "reader.mjs" goto incomplete
if not exist "diagram.mjs" goto incomplete
if not exist "data\iliad\1.json" goto incomplete
if not exist "data\odyssey\1.json" goto incomplete
if not exist "serve_reader.py" goto incomplete
echo Keep this window open while reading.
where py >nul 2>nul
if errorlevel 1 (
    python serve_reader.py
) else (
    py -3 serve_reader.py
)
pause
exit /b
:incomplete
echo Reader files are missing from this folder.
echo Right-click Greek-Reading-Tool.zip, choose Extract All, and run start-reader.cmd from the extracted folder.
pause
exit /b 1

