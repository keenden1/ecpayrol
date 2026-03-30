<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionRoleSeeder extends Seeder
{
    public function run()
    {
        $superadmin = Role::where('slug', 'superadmin')->first();
        $payroll = Role::where('slug', 'payroll_officer')->first();
        $finance = Role::where('slug', 'finance')->first();
        $employee = Role::where('slug', 'employee')->first();
        $manager = Role::where('slug', 'manager')->first();

        $permissions = Permission::all();

        if ($superadmin) {
            $superadmin->permissions()->attach($permissions->pluck('id'));
        }

        if ($payroll) {
            $payroll->permissions()->attach(
                Permission::whereIn('slug', [
                    'view-employees',
                    'manage-employees',
                    'view-attendance',
                    'manage-attendance',
                ])->pluck('id')
            );
        }

        if ($finance) {
            $finance->permissions()->attach(
                Permission::whereIn('slug', [
                    'view-finance',
                    'manage-finance',
                ])->pluck('id')
            );
        }

        if ($manager) {
            $manager->permissions()->attach(
                Permission::whereIn('slug', [
                    'view-employees',
                    'view-attendance',
                ])->pluck('id')
            );
        }
    }
}