<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ManagerDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Manager', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
