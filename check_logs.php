<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== BIOMETRIC LOGS SUMMARY ===\n\n";

$totalLogs = DB::table('processed_attendances')
    ->where('source', 'biometric')
    ->count();

echo "Total biometric logs in database: {$totalLogs}\n\n";

if ($totalLogs > 0) {
    $recentLogs = DB::table('processed_attendances')
        ->where('source', 'biometric')
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get(['employee_id', 'attendance_date', 'time_in', 'time_out', 'hours_worked', 'created_at']);

    echo "Recent 5 logs:\n";
    echo str_repeat("-", 100) . "\n";
    printf("%-12s %-15s %-20s %-20s %-12s %-20s\n",
        "Employee ID", "Date", "Time In", "Time Out", "Hours", "Created At");
    echo str_repeat("-", 100) . "\n";

    foreach ($recentLogs as $log) {
        printf("%-12s %-15s %-20s %-20s %-12s %-20s\n",
            $log->employee_id,
            $log->attendance_date,
            $log->time_in ?? 'N/A',
            $log->time_out ?? 'N/A',
            $log->hours_worked ?? 'N/A',
            $log->created_at
        );
    }
    echo str_repeat("-", 100) . "\n";
}

echo "\nTo view all logs, go to: /payroll-summaries-page or /attendance in your browser\n";
