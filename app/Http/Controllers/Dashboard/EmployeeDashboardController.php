<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Overtime;
use App\Models\DepartmentManager;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($this->userHasRole($user, 'superadmin')) {
            return Inertia::render('SuperadminDashboard', ['auth' => ['user' => $user]]);
        } elseif ($this->userHasRole($user, 'hrd_manager')) {
            return $this->hrdManagerDashboard($user);
        } elseif ($this->userHasRole($user, 'department_manager')) {
            return $this->departmentManagerDashboard($user);
        } else {
            return $this->employeeDashboard($user);
        }
    }

    private function hrdManagerDashboard($user)
    {
        $pendingOvertimes = Overtime::with(['employee', 'departmentManager', 'departmentApprover'])
            ->where('status', 'manager_approved')
            ->latest()
            ->get();

        $departmentsStats = $this->getDepartmentStats();

        $organizationStats = [
            'totalEmployees' => Employee::count(),
            'employeeChange' => '+' . rand(1, 10),
            'leaveRequests' => 12,
            'leaveChange' => '+2',
            'attendanceRate' => '95%',
            'attendanceChange' => '+1%',
        ];

        return Inertia::render('HrdManagerDashboard', [
            'auth' => ['user' => $user],
            'pendingOvertimes' => $pendingOvertimes,
            'departmentsStats' => $departmentsStats,
            'organizationStats' => $organizationStats,
            'recentActivities' => $this->getRecentActivities(),
        ]);
    }

    private function departmentManagerDashboard($user)
    {
        $managedDepartments = DepartmentManager::where('manager_id', $user->id)
            ->pluck('department')
            ->toArray();

        $departmentEmployees = Employee::whereIn('Department', $managedDepartments)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'idno' => $e->idno,
                'Fname' => $e->Fname,
                'Lname' => $e->Lname,
                'Department' => $e->Department,
                'Jobtitle' => $e->Jobtitle,
                'status' => $e->JobStatus === 'Active' ? 'active' : 'inactive',
            ]);

        $pendingOvertimes = Overtime::with(['employee', 'creator'])
            ->where('status', 'pending')
            ->where(function ($query) use ($user, $managedDepartments) {
                $query->where('dept_manager_id', $user->id)
                    ->orWhereHas('employee', fn($q) => $q->whereIn('Department', $managedDepartments));
            })
            ->latest()
            ->get();

        return Inertia::render('DepartmentManagerDashboard', [
            'auth' => ['user' => $user],
            'pendingOvertimes' => $pendingOvertimes,
            'departmentEmployees' => $departmentEmployees,
            'departmentStats' => [
                'employeeCount' => $departmentEmployees->count(),
                'attendanceRate' => '96%',
                'leaveRequestsCount' => 3,
            ],
            'upcomingEvents' => [
                ['title' => 'Team Meeting', 'date' => 'Tomorrow, 10:00 AM'],
                ['title' => 'Training Session', 'date' => 'Friday, 2:00 PM'],
            ],
            'managedDepartments' => $managedDepartments,
        ]);
    }

    private function employeeDashboard($user)
    {
        $employeeRecord = Employee::where('idno', $user->employee_id)->first();

        $myOvertimes = Overtime::with(['departmentManager', 'departmentApprover', 'hrdApprover'])
            ->where(function ($query) use ($user, $employeeRecord) {
                if ($employeeRecord) {
                    $query->where('employee_id', $employeeRecord->id);
                }
                $query->orWhere('created_by', $user->id);
            })
            ->latest()
            ->get();

        return Inertia::render('Employee/Dashboard', [
            'auth' => ['user' => $user->load('roles')],
            'myOvertimes' => $myOvertimes,
            'employeeInfo' => [
                'id' => $employeeRecord->id ?? null,
                'name' => $employeeRecord ? $employeeRecord->Fname . ' ' . $employeeRecord->Lname : $user->name,
                'jobTitle' => $employeeRecord->Jobtitle ?? 'Employee',
                'department' => $employeeRecord->Department ?? 'General',
                'totalOvertimeHours' => $this->calculateMonthlyOvertimeHours($myOvertimes),
                'leaveBalance' => '12',
                'attendancePercentage' => '98%',
            ],
            'notifications' => $this->generateEmployeeNotifications($myOvertimes),
            'upcomingEvents' => [
                ['title' => 'Team Meeting', 'date' => 'Tomorrow, 10:00 AM'],
                ['title' => 'Training Session', 'date' => 'Friday, 2:00 PM'],
                ['title' => 'Company Town Hall', 'date' => 'Next Monday, 9:00 AM'],
            ],
        ]);
    }

    private function userHasRole($user, $roleName)
    {
        if (method_exists($user, 'roles') && $user->roles) {
            return $user->roles->pluck('name')->contains($roleName);
        }
        if (method_exists($user, 'getRoleSlug')) {
            return $user->getRoleSlug() === $roleName;
        }
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($roleName);
        }
        return match ($roleName) {
            'superadmin' => stripos($user->name, 'admin') !== false || $user->id === 1,
            'hrd_manager' => stripos($user->name, 'hrd manager') !== false || stripos($user->email, 'hrdmanager') !== false,
            'department_manager' => DepartmentManager::where('manager_id', $user->id)->exists(),
            default => false,
        };
    }

    private function calculateMonthlyOvertimeHours($overtimes)
    {
        $now = Carbon::now();
        $hours = $overtimes
            ->filter(fn($ot) => Carbon::parse($ot->date)->month === $now->month
                && Carbon::parse($ot->date)->year === $now->year
                && $ot->status === 'approved')
            ->sum('total_hours');
        return $hours ? number_format($hours, 2) : '0';
    }

    private function generateEmployeeNotifications($overtimes)
    {
        $notifications = [];
        foreach ($overtimes->take(5) as $overtime) {
            if ($overtime->status === 'approved' && $overtime->hrd_approved_at) {
                $notifications[] = ['type' => 'approval', 'message' => 'Your overtime request for ' . Carbon::parse($overtime->date)->format('M d, Y') . ' has been approved', 'time' => Carbon::parse($overtime->hrd_approved_at)->diffForHumans()];
            } elseif ($overtime->status === 'manager_approved' && $overtime->dept_approved_at) {
                $notifications[] = ['type' => 'approval', 'message' => 'Your overtime request was approved by department manager and is awaiting final approval', 'time' => Carbon::parse($overtime->dept_approved_at)->diffForHumans()];
            } elseif ($overtime->status === 'rejected') {
                $notifications[] = ['type' => 'rejection', 'message' => 'Your overtime request for ' . Carbon::parse($overtime->date)->format('M d, Y') . ' was rejected', 'time' => Carbon::parse($overtime->dept_approved_at ?? $overtime->hrd_approved_at)->diffForHumans()];
            }
        }
        if (count($notifications) < 3) {
            $notifications[] = ['type' => 'info', 'message' => 'Welcome to your Employee Dashboard!', 'time' => 'Just now'];
            $notifications[] = ['type' => 'info', 'message' => 'New training opportunities available in your department', 'time' => '2 days ago'];
        }
        return $notifications;
    }

    private function getDepartmentStats()
    {
        return Employee::distinct()->pluck('Department')->filter()->values()
            ->map(fn($dept) => [
                'name' => $dept,
                'employeeCount' => Employee::where('Department', $dept)->count(),
                'attendanceRate' => rand(85, 99),
            ])->toArray();
    }

    private function getRecentActivities()
    {
        return [
            ['message' => 'New employee Mia Rodriguez onboarded', 'time' => '2 hours ago'],
            ['message' => 'Overtime policy updated - sent to all departments', 'time' => '1 day ago'],
            ['message' => '5 overtime requests approved for Tech Department', 'time' => '1 day ago'],
            ['message' => 'Employee satisfaction survey results published', 'time' => '2 days ago'],
            ['message' => 'Training schedule for Q3 published', 'time' => '3 days ago'],
        ];
    }
}
