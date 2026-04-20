<?php

namespace App\Console\Commands;

use App\Jobs\ProcessBiometricLogs;
use App\Models\BiometricDevice;
use App\Models\BiometricSyncLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FetchAllBiometricLogs extends Command
{
    protected $signature = 'biometric:fetch-all
                            {--start-date= : Optional start date (Y-m-d)}
                            {--end-date=   : Optional end date (Y-m-d)}
                            {--process     : Fetch AND process logs into processed_attendances (default: legacy Python-only fetch)}';

    protected $description = 'Fetch attendance logs from all active biometric devices. Use --process to also persist them into processed_attendances.';

    public function handle(): int
    {
        $startDate = $this->option('start-date') ?: null;
        $endDate   = $this->option('end-date')   ?: null;

        // New path: fetch + process per device using the Laravel job (QUEUE_CONNECTION=sync runs inline)
        if ($this->option('process')) {
            return $this->runFetchAndProcess($startDate, $endDate);
        }

        // Legacy path: fire-and-forget Python script. Populates biometric_logs only.
        $script = base_path('biometric_fetch_all.py');

        if (!file_exists($script)) {
            $this->error("biometric_fetch_all.py not found at: {$script}");
            return 1;
        }

        $cmd = "python \"{$script}\"";
        if ($startDate) $cmd .= " --start-date {$startDate}";
        if ($endDate)   $cmd .= " --end-date {$endDate}";

        $this->info("Running: {$cmd}");
        Log::info("biometric:fetch-all starting Python script: {$cmd}");

        if (PHP_OS_FAMILY === 'Windows') {
            pclose(popen("start /B {$cmd}", "r"));
            $this->info('Python script launched in background.');
        } else {
            exec("{$cmd} > /dev/null 2>&1 &");
            $this->info('Python script launched in background.');
        }

        return 0;
    }

    private function runFetchAndProcess(?string $startDate, ?string $endDate): int
    {
        $devices = BiometricDevice::where('status', 'active')->get();

        if ($devices->isEmpty()) {
            $this->warn('No active biometric devices found.');
            return 0;
        }

        $this->info("Fetching + processing logs from {$devices->count()} active device(s).");

        $ok = 0;
        $failed = 0;

        foreach ($devices as $device) {
            try {
                $syncLog = BiometricSyncLog::create([
                    'device_id'      => $device->id,
                    'initiated_by'   => null,
                    'start_date'     => $startDate,
                    'end_date'       => $endDate,
                    'status'         => 'pending',
                    'current_stage'  => 'Queued by scheduler...',
                ]);

                $job = new ProcessBiometricLogs($syncLog);
                $job->previewOnly = false;
                dispatch($job);

                $syncLog->refresh();
                $ok++;
                $this->info("  [{$device->name}] done (sync_log_id={$syncLog->id}, saved={$syncLog->saved_records}, updated={$syncLog->updated_records}).");
            } catch (\Throwable $e) {
                $failed++;
                Log::error('biometric:fetch-all --process failed for device', [
                    'device_id' => $device->id,
                    'device'    => $device->name,
                    'error'     => $e->getMessage(),
                ]);
                $this->error("  [{$device->name}] FAILED: {$e->getMessage()}");
            }
        }

        $this->info("Done. Success: {$ok}, Failed: {$failed}.");
        return $failed === 0 ? 0 : 1;
    }
}
