<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Employee/Dashboard', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
