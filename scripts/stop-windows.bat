@echo off
echo Stopping PreLegal...

taskkill /FI "WINDOWTITLE eq PreLegal Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PreLegal Frontend*" /F >nul 2>&1

echo Done.
