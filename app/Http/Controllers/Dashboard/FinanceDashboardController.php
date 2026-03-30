<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class FinanceDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Finance', [
            'auth' => [
                'user' => auth()->user()->load('roles')
            ]
        ]);
    }
}
