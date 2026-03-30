<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PayrollDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Payroll', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
