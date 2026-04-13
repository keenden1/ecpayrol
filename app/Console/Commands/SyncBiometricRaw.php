<?php

namespace App\Console\Commands;

use App\Models\BiometricDevice;
use App\Models\BiometricSyncLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Rats\Zkteco\Lib\ZKTeco;

class SyncBiometricRaw extends Command
{
    protected $signature = 'biometric:sync-raw {device_id} {log_id}';
    protected $description = 'Sync raw attendance logs from a biometric device to JSON cache';

    public function handle(): int
    {
        $deviceId = $this->argument('device_id');
        $logId    = $this->argument('log_id');

        $log    = BiometricSyncLog::find($logId);
        $device = BiometricDevice::find($deviceId);

        if (!$log || !$device) {
            Log::error("SyncBiometricRaw: log or device not found (log_id={$logId}, device_id={$deviceId})");
            return 1;
        }

        $log->update(['status' => 'fetching', 'current_stage' => 'Connecting to device...', 'started_at' => now()]);

        try {
            set_time_limit(0);
            ini_set('memory_limit', '1024M');

            $zk = new ZKTeco($device->ip_address, $device->port);

            $connectTimeout = 10;
            $connected      = false;
            $connectStart   = microtime(true);

            while (!$connected && (microtime(true) - $connectStart) < $connectTimeout) {
                $connected = $zk->connect();
                if (!$connected) usleep(500000);
            }

            if (!$connected) {
                $log->update([
                    'status'        => 'failed',
                    'error_message' => 'Failed to connect to device after ' . $connectTimeout . ' seconds',
                    'completed_at'  => now(),
                ]);
                return 1;
            }

            $log->update(['current_stage' => 'Fetching attendance logs...']);

            // Fetch with retry (device sometimes returns 0 logs on first attempt)
            $rawLogs = [];
            for ($attempt = 1; $attempt <= 5; $attempt++) {
                $rawLogs = $zk->getAttendance();
                if (count($rawLogs) > 0) break;
                if ($attempt < 5) {
                    $zk->disconnect();
                    sleep(4);
                    $zk->connect();
                }
            }

            $zk->disconnect();

            $fetchTime = now()->toDateTimeString();
            $total     = count($rawLogs);

            $log->update(['current_stage' => "Saving {$total} logs to cache...", 'total_logs' => $total]);

            // Save to JSON cache
            $cacheDir = base_path('device-logs');
            if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

            $cachePath = "{$cacheDir}/cache_device_{$device->id}_raw.json";
            file_put_contents($cachePath, json_encode([
                'device_id'   => $device->id,
                'device_name' => $device->name,
                'fetch_time'  => $fetchTime,
                'total_logs'  => $total,
                'logs'        => $rawLogs,
            ], JSON_PRETTY_PRINT));

            // Update device last_sync timestamp
            BiometricDevice::where('id', $device->id)->update(['last_sync' => now()]);

            $log->update([
                'status'        => 'completed',
                'total_logs'    => $total,
                'current_stage' => "Done — {$total} logs cached",
                'completed_at'  => now(),
            ]);

            return 0;

        } catch (\Exception $e) {
            Log::error('SyncBiometricRaw error: ' . $e->getMessage());
            $log->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at'  => now(),
            ]);
            return 1;
        }
    }
}
