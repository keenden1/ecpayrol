<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Employee', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
