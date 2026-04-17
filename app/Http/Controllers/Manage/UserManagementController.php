<?php

namespace App\Http\Controllers\Manage;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index()
    {
        $users = User::with('roles')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'photo_path' => $u->photo_path,
                'roles'      => $u->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'slug' => $r->slug]),
                'created_at' => $u->created_at->format('M d, Y'),
            ]);

        $roles = Role::orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Manage/Users', [
            'auth'  => ['user' => Auth::user()->load('roles')],
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'role_id'  => ['required', 'exists:roles,id'],
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->roles()->sync([$request->role_id]);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'unique:users,email,' . $id],
            'role_id' => ['required', 'exists:roles,id'],
            'password' => ['nullable', Password::min(8)],
        ]);

        $user->update([
            'name'  => $request->name,
            'email' => $request->email,
            ...(filled($request->password) ? ['password' => Hash::make($request->password)] : []),
        ]);

        $user->roles()->sync([$request->role_id]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->roles()->detach();
        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
