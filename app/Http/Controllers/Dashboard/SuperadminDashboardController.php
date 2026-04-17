<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use App\Models\FinalPayroll;
use App\Models\Overtime;
use App\Models\Benefit;
use App\Models\Deduction;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SuperadminDashboardController extends Controller
{
    public function index()
    {
        $now   = Carbon::now();
        $month = $now->month;
        $year  = $now->year;

        // Core counts
        $totalEmployees    = Employee::where('JobStatus', 'Active')->count();
        $inactiveEmployees = Employee::where('JobStatus', 'Inactive')->count();
        $newEmployeesMonth = Employee::whereMonth('created_at', $month)->whereYear('created_at', $year)->count();
        $totalUsers        = User::count();

        $pendingOvertimes  = Overtime::where('status', 'pending')->count();
        $pendingBenefits   = Benefit::where('is_posted', false)->count();
        $pendingDeductions = Deduction::where('is_posted', false)->count();
        $pendingRequests   = $pendingOvertimes + $pendingBenefits + $pendingDeductions;

        $payrollThisMonth  = FinalPayroll::whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('net_pay');
        $totalPayrolls     = FinalPayroll::whereMonth('created_at', $month)->whereYear('created_at', $year)->count();

        $postedBenefits    = Benefit::where('is_posted', true)->count();
        $postedDeductions  = Deduction::where('is_posted', true)->count();

        // Monthly payroll trend (last 6 months)
        $payrollTrend = collect(range(5, 0))->map(function ($i) {
            $date  = Carbon::now()->subMonths($i);
            $total = FinalPayroll::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('net_pay');
            return [
                'month' => $date->format('M'),
                'total' => round($total, 2),
            ];
        })->values()->toArray();

        // Employee status breakdown
        $employeeStatus = [
            ['label' => 'Active',   'value' => $totalEmployees],
            ['label' => 'Inactive', 'value' => $inactiveEmployees],
        ];

        // Requests breakdown
        $requestsBreakdown = [
            ['label' => 'Overtime',   'value' => $pendingOvertimes],
            ['label' => 'Benefits',   'value' => $pendingBenefits],
            ['label' => 'Deductions', 'value' => $pendingDeductions],
        ];

        // Benefits & Deductions status
        $benefitsStatus = [
            ['label' => 'Not Posted', 'value' => $pendingBenefits],
            ['label' => 'Posted',     'value' => $postedBenefits],
        ];
        $deductionsStatus = [
            ['label' => 'Not Posted', 'value' => $pendingDeductions],
            ['label' => 'Posted',     'value' => $postedDeductions],
        ];

        // Overtime trend (last 6 months)
        $overtimeTrend = collect(range(5, 0))->map(function ($i) {
            $date  = Carbon::now()->subMonths($i);
            $count = Overtime::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();
            return [
                'month' => $date->format('M'),
                'count' => $count,
            ];
        })->values()->toArray();

        return Inertia::render('Dashboard/Superadmin', [
            'auth' => ['user' => auth()->user()->load('roles')],
            'stats' => [
                'totalEmployees'    => $totalEmployees,
                'inactiveEmployees' => $inactiveEmployees,
                'newEmployeesMonth' => $newEmployeesMonth,
                'totalUsers'        => $totalUsers,
                'pendingRequests'   => $pendingRequests,
                'pendingOvertimes'  => $pendingOvertimes,
                'payrollThisMonth'  => $payrollThisMonth,
                'totalPayrolls'     => $totalPayrolls,
                'postedBenefits'    => $postedBenefits,
                'postedDeductions'  => $postedDeductions,
            ],
            'charts' => [
                'payrollTrend'      => $payrollTrend,
                'employeeStatus'    => $employeeStatus,
                'requestsBreakdown' => $requestsBreakdown,
                'benefitsStatus'    => $benefitsStatus,
                'deductionsStatus'  => $deductionsStatus,
                'overtimeTrend'     => $overtimeTrend,
            ],
        ]);
    }
}
