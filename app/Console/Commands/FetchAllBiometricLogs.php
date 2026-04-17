<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FetchAllBiometricLogs extends Command
{
    protected $signature = 'biometric:fetch-all
                            {--start-date= : Optional start date (Y-m-d)}
                            {--end-date=   : Optional end date (Y-m-d)}';

    protected $description = 'Fetch attendance logs from all active biometric devices via Python/pyzk';

    public function handle(): int
    {
        $startDate = $this->option('start-date') ?: null;
        $endDate   = $this->option('end-date')   ?: null;

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
            // Run in background on Windows
            pclose(popen("start /B {$cmd}", "r"));
            $this->info('Python script launched in background.');
        } else {
            // Run in background on Linux/Mac
            exec("{$cmd} > /dev/null 2>&1 &");
            $this->info('Python script launched in background.');
        }

        return 0;
    }
}
