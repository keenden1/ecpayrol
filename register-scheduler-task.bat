@echo off
REM Register the Laravel minute-ticker as a Windows Scheduled Task.
REM Runs scheduler-run.bat every 1 minute under the current user.

schtasks /Create /SC MINUTE /MO 1 /TN "EC_HRIS_Scheduler" /TR "C:\xampp\htdocs\hris\ecpayrol\scheduler-run.bat" /F

if %ERRORLEVEL% EQU 0 (
  echo.
  echo SUCCESS: Scheduled task "EC_HRIS_Scheduler" registered.
  schtasks /Query /TN "EC_HRIS_Scheduler" /V /FO LIST | findstr /C:"TaskName" /C:"Next Run" /C:"Status" /C:"Schedule Type" /C:"Repeat: Every"
) else (
  echo.
  echo FAILED to register task. Error code: %ERRORLEVEL%
)

exit /b %ERRORLEVEL%
