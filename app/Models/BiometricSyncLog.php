<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiometricSyncLog extends Model
{
    protected $fillable = [
        'device_id',
        'initiated_by',
        'start_date',
        'end_date',
        'status',
        'total_logs',
        'processed_logs',
        'skipped_logs',
        'saved_records',
        'updated_records',
        'current_stage',
        'error_message',
        'unmatched_employees',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'unmatched_employees' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(BiometricDevice::class, 'device_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->total_logs == 0) {
            return 0;
        }
        return round(($this->processed_logs / $this->total_logs) * 100, 2);
    }

    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    public function scopeForDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', ['pending', 'fetching', 'processing']);
    }
}
