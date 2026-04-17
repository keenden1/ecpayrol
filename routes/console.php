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
    $cmd = Schedule::command('biometric:fetch-all')
        ->withoutOverlapping()
        ->runInBackground()
        ->appendOutputTo(storage_path('logs/biometric-fetch-all.log'));

    $type = $scheduleConfig['schedule_type'] ?? 'daily';
    if ($type === 'interval') {
        $minutes = (int)($scheduleConfig['interval'] ?? 60);
        $cmd->everyMinutes($minutes);
    } else {
        $cmd->dailyAt($scheduleConfig['time'] ?? '23:00');
    }
}
