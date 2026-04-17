<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Fetch attendance logs from all active biometric devices (time configurable via UI)
$scheduleConfig = @json_decode(file_get_contents(storage_path('app/biometric_schedule.json')), true);
if (!empty($scheduleConfig['enabled'])) {
    $scheduleTime = $scheduleConfig['time'] ?? '23:00';
    Schedule::command('biometric:fetch-all')
        ->dailyAt($scheduleTime)
        ->withoutOverlapping()
        ->runInBackground()
        ->appendOutputTo(storage_path('logs/biometric-fetch-all.log'));
}
