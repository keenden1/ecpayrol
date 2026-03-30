<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class SuperadminDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Superadmin', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
