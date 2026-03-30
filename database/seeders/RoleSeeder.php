<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'superadmin',
            ],
            [
                'name' => 'Payroll Officer',
                'slug' => 'payroll_officer',
            ],
            [
                'name' => 'Finance',
                'slug' => 'finance',
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}