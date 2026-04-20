@echo off
REM Laravel scheduler tick — registered in Windows Task Scheduler to run every 1 minute.
REM Fires whatever commands are defined in routes/console.php (e.g., biometric:fetch-all --process).

cd /d "c:\xampp\htdocs\hris\ecpayrol"
"c:\xampp\php\php.exe" artisan schedule:run >> "c:\xampp\htdocs\hris\ecpayrol\storage\logs\scheduler.log" 2>&1
exit /b 0
