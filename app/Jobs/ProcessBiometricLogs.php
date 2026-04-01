<?php

namespace App\Jobs;

use App\Models\BiometricDevice;
use App\Models\BiometricSyncLog;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Rats\Zkteco\Lib\ZKTeco;

class ProcessBiometricLogs implements ShouldQueue
{
    use Queueable;

    public $timeout = 0; // No timeout — large device logs can take over an hour
    public $tries = 1; // Don't retry automatically
    public bool $previewOnly = false;
    public bool $useCache = false;
    public ?int $limit = null;
    public ?array $userIds = null;

    protected $syncLog;
    protected $deviceId;
    protected $startDate;
    protected $endDate;

    /**
     * Create a new job instance.
     */
    public function __construct(BiometricSyncLog $syncLog)
    {
        $this->syncLog = $syncLog;
        $this->deviceId = $syncLog->device_id;
        $this->startDate = $syncLog->start_date?->format('Y-m-d');
        $this->endDate = $syncLog->end_date?->format('Y-m-d');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Mark as started
            $this->updateSyncLog([
                'status' => 'fetching',
                'started_at' => now(),
                'current_stage' => 'Connecting to biometric device...'
            ]);

            // Get the device
            $device = BiometricDevice::select(['id', 'name', 'ip_address', 'port'])->findOrFail($this->deviceId);

            // Increase memory for large datasets
            ini_set('memory_limit', '1024M');
            set_time_limit(0); // No limit — large device logs can take a long time

            $cachePath = base_path("device-logs/cache_device_{$device->id}_raw.json");

            // Load from cache if requested and available
            if ($this->useCache && file_exists($cachePath)) {
                $this->updateSyncLog([
                    'status' => 'fetching',
                    'current_stage' => 'Loading logs from cached file...',
                ]);
                $cached = json_decode(file_get_contents($cachePath), true);
                $rawLogsFromDevice = $cached['logs'] ?? [];
            } else {
                // Connect to device
                $zk = new ZKTeco($device->ip_address, $device->port);

                $this->updateSyncLog(['current_stage' => 'Establishing connection...']);

                $connectTimeout = 10;
                $connected = false;
                $connectStart = microtime(true);

                while (!$connected && (microtime(true) - $connectStart) < $connectTimeout) {
                    $connected = $zk->connect();
                    if (!$connected) {
                        usleep(500000); // 500ms
                    }
                }

                if (!$connected) {
                    throw new \Exception('Failed to connect to device after ' . $connectTimeout . ' seconds');
                }

                // Fetch logs — retry up to 5x if device returns 0 (large log stores can cause the device to dump empty)
                $maxFetchAttempts = 5;
                $rawLogsFromDevice = [];

                for ($attempt = 1; $attempt <= $maxFetchAttempts; $attempt++) {
                    $this->updateSyncLog([
                        'status' => 'fetching',
                        'current_stage' => $attempt === 1
                            ? 'Retrieving attendance logs from device...'
                            : "Device returned 0 logs — retrying ({$attempt}/{$maxFetchAttempts})...",
                    ]);

                    $rawLogsFromDevice = $zk->getAttendance();

                    if (count($rawLogsFromDevice) > 0) {
                        break;
                    }

                    if ($attempt < $maxFetchAttempts) {
                        $zk->disconnect();
                        sleep(4);
                        $zk->connect();
                    }
                }

                $zk->disconnect();

                // Persist successful dump as cache for future use
                if (count($rawLogsFromDevice) > 0) {
                    file_put_contents($cachePath, json_encode([
                        'device_id'   => $device->id,
                        'device_name' => $device->name,
                        'fetch_time'  => now()->toDateTimeString(),
                        'total_logs'  => count($rawLogsFromDevice),
                        'logs'        => $rawLogsFromDevice,
                    ], JSON_PRETTY_PRINT));
                }
            }

            $this->saveRawLogsToFile($rawLogsFromDevice, $device, 'raw_unfiltered');

            $rawCount = count($rawLogsFromDevice);

            $logs = $this->filterAndValidateLogs($rawLogsFromDevice);
            $this->saveRawLogsToFile($logs, $device, 'filtered');

            $totalLogs = count($logs);

            // Determine no-records reason early for use in preview
            $noRecordsReason = null;
            if ($rawCount === 0) {
                $noRecordsReason = 'device_empty';
            } elseif ($totalLogs === 0) {
                $noRecordsReason = 'filtered_out';
            }

            $this->updateSyncLog([
                'total_logs' => $totalLogs,
                'status' => 'processing',
                'current_stage' => "Processing {$totalLogs} attendance records..."
            ]);

            // Process logs (and optionally save)
            $result = $this->saveBiometricLogsBatch($logs);

            // Detect all-unmatched scenario
            if ($noRecordsReason === null && $this->previewOnly) {
                $previewCount = $result['total_records'] ?? 0;
                if ($previewCount === 0 && $rawCount > 0 && $totalLogs > 0) {
                    $noRecordsReason = 'all_unmatched';
                }
            }

            $device->last_sync = now();
            $device->save();

            if ($this->previewOnly) {
                // Store preview records in cache for the save step
                Cache::put(
                    "biometric_preview_{$this->syncLog->id}",
                    $result['preview_records'],
                    now()->addHours(2)
                );

                Cache::put(
                    "biometric_fetch_meta_{$this->syncLog->id}",
                    [
                        'raw_count'        => $rawCount,
                        'filtered_count'   => $totalLogs,
                        'no_records_reason'=> $noRecordsReason,
                    ],
                    now()->addHours(2)
                );

                $this->updateSyncLog([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'current_stage' => 'Preview ready — ' . $result['total_records'] . ' records found (not saved)',
                    'processed_logs' => $result['processed_count'],
                    'skipped_logs'   => $result['skipped_count'],
                    'saved_records'  => $result['new_count'],
                    'updated_records'=> $result['update_count'],
                    'unmatched_employees' => $result['unmatched_employees'] ?? [],
                ]);
            } else {
                $this->updateSyncLog([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'current_stage' => 'Sync completed successfully',
                    'processed_logs' => $result['processed_count'],
                    'skipped_logs'   => $result['skipped_count'],
                    'saved_records'  => $result['saved_count'],
                    'updated_records'=> $result['updated_count'],
                    'unmatched_employees' => $result['unmatched_employees'] ?? [],
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Biometric sync job failed: ' . $e->getMessage(), [
                'sync_log_id' => $this->syncLog->id,
                'device_id' => $this->deviceId,
                'trace' => $e->getTraceAsString()
            ]);

            $this->updateSyncLog([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
                'current_stage' => 'Failed: ' . $e->getMessage()
            ]);

            throw $e;
        }
    }

    private function updateSyncLog(array $data): void
    {
        $this->syncLog->update($data);
        $this->syncLog->refresh();
    }

    private function filterAndValidateLogs($rawLogs): array
    {
        $logs = $rawLogs;

        // Filter invalid records
        $logs = array_filter($logs, function($log) {
            return isset($log['id']) && isset($log['timestamp']);
        });

        // Filter by date range
        if ($this->startDate || $this->endDate) {
            $start = $this->startDate ? Carbon::parse($this->startDate)->startOfDay() : null;
            $end   = $this->endDate   ? Carbon::parse($this->endDate)->endOfDay()     : null;

            $logs = array_filter($logs, function($log) use ($start, $end) {
                try {
                    $logTime = Carbon::parse($log['timestamp']);
                } catch (\Exception $e) {
                    return false;
                }
                if ($start && $logTime->lt($start)) return false;
                if ($end   && $logTime->gt($end))   return false;
                return true;
            });
        }

        // Filter to matched users only
        if ($this->userIds !== null) {
            $logs = array_filter($logs, function($log) {
                return in_array((string)($log['id'] ?? ''), $this->userIds, true);
            });
        }

        // Limit records for testing
        if ($this->limit !== null) {
            $logs = array_slice($logs, 0, $this->limit);
        }

        return array_values($logs);
    }

    private function saveBiometricLogsBatch($logs): array
    {
        $batchSize = 100;
        $processedLogs = 0;
        $skippedLogs = 0;
        $savedRecords = 0;
        $updatedRecords = 0;
        $unmatchedEmployees = [];

        // Process logs with pattern recognition
        $processedLogsWithStatus = $this->processLogsWithOptimizedPatternRecognition($logs);

        // Collect punches by employee
        $employeePunches = [];
        foreach ($processedLogsWithStatus as $log) {
            try {
                $extractedLog = $this->extractLogDetails($log);
                $biometricId = $extractedLog['user_id'];

                // Cache employee lookups
                $cacheKey = "employee_idno_{$biometricId}";
                $employee = Cache::remember($cacheKey, 3600, function() use ($biometricId) {
                    return Employee::where('idno', $biometricId)->first();
                });

                if (!$employee) {
                    $skippedLogs++;
                    if (!in_array($biometricId, $unmatchedEmployees)) {
                        $unmatchedEmployees[] = $biometricId;
                    }
                    continue;
                }

                $timestamp = Carbon::parse($extractedLog['timestamp']);

                if (!isset($employeePunches[$employee->id])) {
                    $employeePunches[$employee->id] = [];
                }

                $employeePunches[$employee->id][] = [
                    'timestamp' => $timestamp,
                    'state' => $extractedLog['state'] ?? null,
                    'actual_status' => $log['actual_status'] ?? null
                ];
                $processedLogs++;

                // Update progress periodically
                if ($processedLogs % 50 == 0) {
                    $this->updateSyncLog([
                        'processed_logs' => $processedLogs,
                        'current_stage' => "Processing logs... ({$processedLogs}/{$this->syncLog->total_logs})"
                    ]);
                }
            } catch (\Exception $e) {
                $skippedLogs++;
                Log::warning('Failed to process log entry', [
                    'error' => $e->getMessage(),
                    'log' => $log
                ]);
            }
        }

        // Group logs
        $groupedLogs = $this->groupLogsByEmployeeAndDate($employeePunches);

        // PREVIEW MODE: build records without touching the DB
        if ($this->previewOnly) {
            $this->updateSyncLog(['current_stage' => 'Building preview records...']);

            $employeeCache = [];
            $previewRecords = [];
            $newCount = 0;
            $updateCount = 0;

            foreach ($groupedLogs as $employeeId => $dates) {
                if (!isset($employeeCache[$employeeId])) {
                    $employeeCache[$employeeId] = Employee::find($employeeId);
                }
                $employee = $employeeCache[$employeeId];

                foreach ($dates as $date => $logData) {
                    $dbRecord = $this->createAttendanceRecord($employeeId, $date, $logData);
                    $exists = DB::table('processed_attendances')
                        ->where('employee_id', $employeeId)
                        ->where('attendance_date', $date)
                        ->exists();

                    $previewRecords[] = array_merge($dbRecord, [
                        'employee_idno'  => $employee?->idno ?? 'N/A',
                        'employee_name'  => $employee ? trim($employee->Fname . ' ' . $employee->Lname) : 'Unknown',
                        'is_new'         => !$exists,
                    ]);

                    if ($exists) $updateCount++;
                    else $newCount++;
                }
            }

            return [
                'processed_count'     => $processedLogs,
                'skipped_count'       => $skippedLogs,
                'total_records'       => count($previewRecords),
                'new_count'           => $newCount,
                'update_count'        => $updateCount,
                'unmatched_employees' => $unmatchedEmployees,
                'preview_records'     => $previewRecords,
            ];
        }

        $this->updateSyncLog([
            'current_stage' => 'Saving attendance records to database...'
        ]);

        DB::beginTransaction();
        try {
            $insertBatch = [];

            foreach ($groupedLogs as $employeeId => $dates) {
                foreach ($dates as $date => $logData) {
                    $logEntry = $this->createAttendanceRecord($employeeId, $date, $logData);

                    // Check if record exists
                    $existingRecord = DB::table('processed_attendances')
                        ->where('employee_id', $employeeId)
                        ->where('attendance_date', $date)
                        ->first();

                    if ($existingRecord) {
                        DB::table('processed_attendances')
                            ->where('id', $existingRecord->id)
                            ->update($logEntry);
                        $updatedRecords++;
                    } else {
                        $insertBatch[] = $logEntry;
                        $savedRecords++;
                    }

                    // Batch insert
                    if (count($insertBatch) >= $batchSize) {
                        DB::table('processed_attendances')->insert($insertBatch);
                        $insertBatch = [];
                    }
                }
            }

            // Insert remaining
            if (count($insertBatch) > 0) {
                DB::table('processed_attendances')->insert($insertBatch);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save attendance records', ['error' => $e->getMessage()]);
            throw $e;
        }

        return [
            'processed_count' => $processedLogs,
            'skipped_count' => $skippedLogs,
            'saved_count' => $savedRecords,
            'updated_count' => $updatedRecords,
            'unmatched_employees' => $unmatchedEmployees
        ];
    }

    private function groupLogsByEmployeeAndDate($employeePunches): array
    {
        $groupedLogs = [];

        foreach ($employeePunches as $employeeId => $punches) {
            // Sort chronologically
            usort($punches, function($a, $b) {
                return $a['timestamp'] <=> $b['timestamp'];
            });

            // Get employee shift type
            $employee = Employee::find($employeeId);
            $isNightShiftWorker = false;

            if ($employee) {
                $schedule = EmployeeSchedule::where('employee_id', $employeeId)
                    ->where('status', 'active')
                    ->first();
                $isNightShiftWorker = $schedule && $schedule->shift_type === 'night';
            }

            // Group punches into shifts
            $i = 0;
            while ($i < count($punches)) {
                $punch = $punches[$i];
                $actualStatus = $punch['actual_status'];

                if ($actualStatus === 'Clock In' || $i === 0) {
                    $shiftDate = $punch['timestamp']->format('Y-m-d');

                    if (!isset($groupedLogs[$employeeId][$shiftDate])) {
                        $groupedLogs[$employeeId][$shiftDate] = [
                            'timestamps' => [],
                            'states' => [],
                            'actual_statuses' => []
                        ];
                    }

                    $groupedLogs[$employeeId][$shiftDate]['timestamps'][] = $punch['timestamp'];
                    $groupedLogs[$employeeId][$shiftDate]['states'][] = $punch['state'];
                    $groupedLogs[$employeeId][$shiftDate]['actual_statuses'][] = $actualStatus;

                    // Collect remaining punches for this shift
                    $j = $i + 1;
                    while ($j < count($punches) && $punches[$j]['actual_status'] !== 'Clock In') {
                        $nextPunch = $punches[$j];
                        $hoursDiff = $punch['timestamp']->diffInHours($nextPunch['timestamp']);

                        if ($isNightShiftWorker && $hoursDiff <= 18) {
                            $groupedLogs[$employeeId][$shiftDate]['timestamps'][] = $nextPunch['timestamp'];
                            $groupedLogs[$employeeId][$shiftDate]['states'][] = $nextPunch['state'];
                            $groupedLogs[$employeeId][$shiftDate]['actual_statuses'][] = $nextPunch['actual_status'];
                            $j++;
                        } else {
                            break;
                        }
                    }
                    $i = $j;
                } else {
                    // Orphan punch
                    $shiftDate = $punch['timestamp']->format('Y-m-d');
                    if (!isset($groupedLogs[$employeeId][$shiftDate])) {
                        $groupedLogs[$employeeId][$shiftDate] = [
                            'timestamps' => [],
                            'states' => [],
                            'actual_statuses' => []
                        ];
                    }
                    $groupedLogs[$employeeId][$shiftDate]['timestamps'][] = $punch['timestamp'];
                    $groupedLogs[$employeeId][$shiftDate]['states'][] = $punch['state'];
                    $groupedLogs[$employeeId][$shiftDate]['actual_statuses'][] = $actualStatus;
                    $i++;
                }
            }
        }

        return $groupedLogs;
    }

    private function createAttendanceRecord($employeeId, $date, $logData): array
    {
        $timestamps = $logData['timestamps'];
        $states = $logData['states'];
        $actualStatuses = $logData['actual_statuses'];

        // Sort by timestamp
        array_multisort($timestamps, SORT_ASC, $states, $actualStatuses);

        // Initialize time tracking
        $totalWorkedMinutes = 0;
        $punchIn = null;
        $timeIn = null;
        $timeOut = null;
        $breakIn = null;
        $breakOut = null;

        // Process timestamps
        for ($i = 0; $i < count($timestamps); $i++) {
            $currentTime = $timestamps[$i];
            $currentActualStatus = $actualStatuses[$i];

            switch ($currentActualStatus) {
                case 'Clock In':
                    if ($timeIn === null) {
                        $timeIn = $currentTime;
                    }
                    $punchIn = $currentTime;
                    break;

                case 'Clock Out':
                    $timeOut = $currentTime;
                    if ($punchIn !== null) {
                        $workedMinutes = $punchIn->diffInMinutes($currentTime);
                        $totalWorkedMinutes += $workedMinutes;
                        $punchIn = null;
                    }
                    break;

                case 'Break In':
                    $breakIn = $currentTime;
                    if ($punchIn !== null) {
                        $workedMinutes = $punchIn->diffInMinutes($currentTime);
                        $totalWorkedMinutes += $workedMinutes;
                        $punchIn = null;
                    }
                    break;

                case 'Break Out':
                    $breakOut = $currentTime;
                    $punchIn = $currentTime;
                    break;
            }
        }

        if ($timeIn === null && count($timestamps) > 0) {
            $timeIn = $timestamps[0];
        }

        $notesText = 'Auto-processed via background job';
        $lastStatus = end($actualStatuses);

        if ($timeOut === null && count($timestamps) > 0) {
            if ($lastStatus === 'Clock In' || $lastStatus === 'Break Out') {
                $timeOut = null;
                $notesText .= ' | INCOMPLETE SHIFT - No clock out recorded';
            } else {
                $timeOut = end($timestamps);
            }
        }

        $hoursWorked = null;
        $isNightShift = false;
        $nextDayTimeout = null;

        if ($timeIn && $timeOut) {
            $hoursWorked = round($totalWorkedMinutes / 60, 2);
            $isNightShift = $timeIn->format('Y-m-d') !== $timeOut->format('Y-m-d');

            if ($isNightShift) {
                $nextDayTimeout = $timeOut;
                $timeOut = null;
            }
        }

        return [
            'employee_id' => $employeeId,
            'attendance_date' => $date,
            'time_in' => $timeIn ? $timeIn->format('Y-m-d H:i:s') : null,
            'time_out' => $timeOut ? $timeOut->format('Y-m-d H:i:s') : null,
            'next_day_timeout' => $nextDayTimeout ? $nextDayTimeout->format('Y-m-d H:i:s') : null,
            'break_in' => $breakIn ? $breakIn->format('Y-m-d H:i:s') : null,
            'break_out' => $breakOut ? $breakOut->format('Y-m-d H:i:s') : null,
            'hours_worked' => $hoursWorked,
            'is_nightshift' => $isNightShift,
            'source' => 'biometric',
            'notes' => $notesText,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function processLogsWithOptimizedPatternRecognition($logs): array
    {
        $processedLogs = [];

        foreach ($logs as $log) {
            if (isset($log['state']) && $log['state'] !== null) {
                switch ((int)$log['state']) {
                    case 0:
                        $log['actual_status'] = 'Clock In';
                        break;
                    case 1:
                        $log['actual_status'] = 'Clock Out';
                        break;
                    case 2:
                        $log['actual_status'] = 'Break In';
                        break;
                    case 3:
                        $log['actual_status'] = 'Break Out';
                        break;
                    default:
                        $log['actual_status'] = 'Clock In';
                }
            } else {
                $log['actual_status'] = 'Clock In';
            }

            $processedLogs[] = $log;
        }

        return $processedLogs;
    }

    private function extractLogDetails($log): array
    {
        return [
            'user_id' => $log['id'] ?? $log['uid'] ?? null,
            'timestamp' => $log['timestamp'],
            'state' => $log['state'] ?? null,
            'type' => $log['type'] ?? null,
        ];
    }

    private function saveRawLogsToFile($logs, $device, $prefix = ''): void
    {
        $timestamp = now()->format('Y-m-d_His');
        $prefixPart = $prefix ? "{$prefix}_" : '';
        $filename = "{$prefixPart}device_{$device->id}_{$device->name}_{$timestamp}.json";
        $filepath = base_path("device-logs/{$filename}");

        $data = [
            'device_id' => $device->id,
            'device_name' => $device->name,
            'device_ip' => $device->ip_address,
            'fetch_time' => now()->toDateTimeString(),
            'total_logs' => count($logs),
            'date_range' => [
                'start' => $this->startDate,
                'end' => $this->endDate
            ],
            'logs' => $logs
        ];

        file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));

        Log::info("Raw biometric logs saved to: {$filepath}");
    }
}
