<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $users = [
            [
                'name' => 'Test Admin',
                'email' => 'test@gmail.com',
                'password' => 'password',
                'role' => 'superadmin'
            ],
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@hrms.com',
                'password' => 'password',
                'role' => 'superadmin'
            ],
            [
                'name' => 'Payroll Officer',
                'email' => 'payroll@hrms.com',
                'password' => 'password',
                'role' => 'payroll_officer'
            ],
            [
                'name' => 'Finance Officer',
                'email' => 'finance@hrms.com',
                'password' => 'password',
                'role' => 'finance'
            ],
            [
                'name' => 'John Employee',
                'email' => 'employee@hrms.com',
                'password' => 'password',
                'role' => 'employee',
                'employee_idno' => 'EMP001'
            ],
            [
                'name' => 'Department Manager',
                'email' => 'manager@hrms.com',
                'password' => 'password',
                'role' => 'manager'
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'employee_idno' => $userData['employee_idno'] ?? null,
                'is_employee' => isset($userData['employee_idno']),
            ]);

            $roleModel = Role::where('slug', $role)->first();
            if ($roleModel) {
                $user->roles()->attach($roleModel->id);
            }
        }
    }
}