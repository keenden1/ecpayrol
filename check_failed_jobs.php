<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FAILED JOBS DETAILS ===\n\n";

$failedJobs = DB::table('failed_jobs')
    ->orderBy('failed_at', 'desc')
    ->limit(2)
    ->get();

if ($failedJobs->count() > 0) {
    foreach ($failedJobs as $job) {
        echo "Job ID: {$job->id}\n";
        echo "UUID: {$job->uuid}\n";
        echo "Connection: {$job->connection}\n";
        echo "Queue: {$job->queue}\n";
        echo "Failed At: {$job->failed_at}\n";
        echo "\nException:\n";
        echo str_repeat("-", 80) . "\n";
        echo $job->exception . "\n";
        echo str_repeat("-", 80) . "\n\n";
    }
} else {
    echo "No failed jobs found.\n";
}
