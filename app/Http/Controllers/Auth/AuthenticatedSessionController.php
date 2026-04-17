<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create()
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * Accepts either an email address or an employee ID number as the login identifier.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required',
        ]);

        $identifier = $request->email;

        // If the input is not a valid email, treat it as an employee ID number
        if (!filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('employee_idno', $identifier)->first();
            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => 'No account found for that ID number.',
                ]);
            }
            $identifier = $user->email;
        }

        if (!Auth::attempt(['email' => $identifier, 'password' => $request->password], $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials',
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();
        $role = $user->getRoleSlug();

        $dashboardRoute = match($role) {
            'superadmin' => 'superadmin.dashboard',
            'payroll_officer' => 'payroll.dashboard',
            'finance' => 'finance.dashboard',
            'employee' => 'employee.dashboard',
            'manager' => 'manager.dashboard',
            default => 'employee.dashboard'
        };

        return redirect()->intended(route($dashboardRoute));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Successfully logged out']);
        }

        return redirect('/');
    }
}