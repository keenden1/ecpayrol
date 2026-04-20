<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Fetch attendance logs from all active biometric devices (configurable via UI)
$scheduleConfig = @json_decode(file_get_contents(storage_path('app/biometric_schedule.json')), true);
if (!empty($scheduleConfig['enabled'])) {
    $type = $scheduleConfig['schedule_type'] ?? 'daily';

    // Fetch + process in one command so processed_attendances is updated automatically
    $cmd = Schedule::command('biometric:fetch-all --process')
        ->withoutOverlapping(60)
        ->runInBackground()
        ->appendOutputTo(storage_path('logs/biometric-fetch-all.log'));

    if ($type === 'interval') {
        $minutes = max(1, (int)($scheduleConfig['interval'] ?? 60));
        if ($minutes === 1)       $cmd->everyMinute();
        elseif ($minutes === 5)   $cmd->everyFiveMinutes();
        elseif ($minutes === 10)  $cmd->everyTenMinutes();
        elseif ($minutes === 15)  $cmd->everyFifteenMinutes();
        elseif ($minutes === 30)  $cmd->everyThirtyMinutes();
        elseif ($minutes === 60)  $cmd->hourly();
        else                      $cmd->cron("*/{$minutes} * * * *");
    } else {
        $cmd->dailyAt($scheduleConfig['time'] ?? '23:00');
    }
}
