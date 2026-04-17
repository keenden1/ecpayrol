<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProcessedAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MyAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('idno', $user->employee_idno)->first();

        $month = $request->input('month', now()->month);
        $year  = $request->input('year', now()->year);

        $records = [];
        $summary = [
            'total_days'       => 0,
            'present_days'     => 0,
            'total_hours'      => 0,
            'total_late'       => 0,
            'total_undertime'  => 0,
        ];

        if ($employee) {
            $query = ProcessedAttendance::where('employee_id', $employee->id)
                ->whereYear('attendance_date', $year)
                ->whereMonth('attendance_date', $month)
                ->orderBy('attendance_date', 'desc');

            $attendance = $query->get();

            $records = $attendance->map(fn($a) => [
                'id'               => $a->id,
                'attendance_date'  => $a->attendance_date?->format('Y-m-d'),
                'day'              => $a->day,
                'time_in'          => $a->time_in  ? $a->time_in->format('h:i A')  : null,
                'time_out'         => $a->time_out ? $a->time_out->format('h:i A') : null,
                'hours_worked'     => $a->hours_worked,
                'late_minutes'     => $a->late_minutes,
                'undertime_minutes'=> $a->undertime_minutes,
                'overtime'         => $a->overtime,
                'status'           => $a->status,
                'source'           => $a->source,
                'remarks'          => $a->remarks,
                'is_nightshift'    => $a->is_nightshift,
                'restday'          => $a->restday,
            ])->values();

            $summary = [
                'total_days'      => $attendance->count(),
                'present_days'    => $attendance->filter(fn($a) => $a->time_in)->count(),
                'total_hours'     => round($attendance->sum('hours_worked'), 2),
                'total_late'      => round($attendance->sum('late_minutes'), 0),
                'total_undertime' => round($attendance->sum('undertime_minutes'), 0),
            ];
        }

        return Inertia::render('MyAttendance', [
            'auth'         => ['user' => $user],
            'records'      => $records,
            'summary'      => $summary,
            'employeeInfo' => [
                'name'       => $employee ? trim($employee->Fname . ' ' . $employee->Lname) : $user->name,
                'idno'       => $employee?->idno,
                'department' => $employee?->Department,
                'jobTitle'   => $employee?->Jobtitle,
            ],
            'filters' => ['month' => (int)$month, 'year' => (int)$year],
        ]);
    }
}
