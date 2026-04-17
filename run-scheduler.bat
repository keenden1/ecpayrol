@echo off
cd /d "C:\Users\Admin\Desktop\ecpayroll"
php artisan schedule:run >> "storage\logs\scheduler.log" 2>&1
