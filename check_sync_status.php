<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== BIOMETRIC SYNC STATUS ===\n\n";

$syncLogs = DB::table('biometric_sync_logs')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

if ($syncLogs->count() > 0) {
    foreach ($syncLogs as $log) {
        echo "Sync ID: {$log->id}\n";
        echo "Device ID: {$log->device_id}\n";
        echo "Status: {$log->status}\n";
        echo "Current Stage: {$log->current_stage}\n";
        echo "Total Logs: {$log->total_logs}\n";
        echo "Processed: {$log->processed_logs}\n";
        echo "Saved: {$log->saved_records}\n";
        echo "Updated: {$log->updated_records}\n";
        echo "Skipped: {$log->skipped_logs}\n";
        echo "Error: {$log->error_message}\n";
        echo "Unmatched Employees: {$log->unmatched_employees}\n";
        echo "Started: {$log->started_at}\n";
        echo "Completed: {$log->completed_at}\n";
        echo str_repeat("-", 80) . "\n\n";
    }
} else {
    echo "No sync logs found.\n";
}
