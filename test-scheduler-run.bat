@echo off
schtasks /Run /TN "EC_HRIS_Scheduler"
timeout /t 5 /nobreak >nul
echo.
echo --- Last 30 lines of scheduler.log ---
if exist "C:\xampp\htdocs\hris\ecpayrol\storage\logs\scheduler.log" (
  powershell -NoProfile -Command "Get-Content -Tail 30 'C:\xampp\htdocs\hris\ecpayrol\storage\logs\scheduler.log'"
) else (
  echo scheduler.log does not exist yet.
)
