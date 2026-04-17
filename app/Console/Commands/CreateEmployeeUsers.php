<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateEmployeeUsers extends Command
{
    protected $signature   = 'employees:create-users {--force : Reset password even if user already exists}';
    protected $description = 'Create login accounts for employees that do not have one yet';

    public function handle(): int
    {
        $role  = Role::where('slug', 'employee')->orWhere('name', 'employee')->first();
        $force = $this->option('force');

        $employees = Employee::whereNotNull('idno')->get();
        $created = 0;
        $skipped = 0;
        $reset   = 0;

        foreach ($employees as $employee) {
            $existing = User::where('employee_idno', $employee->idno)->first();

            $password = $this->derivePassword($employee);

            if ($existing) {
                if ($force) {
                    $existing->password = Hash::make($password);
                    $existing->save();
                    $reset++;
                    $this->line("  <comment>RESET</comment>  {$employee->idno} — {$employee->Fname} {$employee->Lname}");
                } else {
                    $skipped++;
                }
                continue;
            }

            $email = $this->resolveEmail($employee);

            $user = User::create([
                'name'          => trim("{$employee->Fname} {$employee->Lname}"),
                'email'         => $email,
                'password'      => Hash::make($password),
                'employee_idno' => $employee->idno,
                'is_employee'   => true,
            ]);

            if ($role) {
                $user->roles()->attach($role->id);
            }

            $created++;
            $this->line("  <info>CREATED</info> {$employee->idno} — {$employee->Fname} {$employee->Lname}  (pw: {$password})");
        }

        $this->newLine();
        $this->info("Done. Created: {$created}  |  Skipped (already exist): {$skipped}  |  Passwords reset: {$reset}");

        return self::SUCCESS;
    }

    private function derivePassword(Employee $employee): string
    {
        if ($employee->Birthdate) {
            try {
                return Carbon::parse($employee->Birthdate)->format('mdY');
            } catch (\Exception) {}
        }
        return $employee->idno;
    }

    private function resolveEmail(Employee $employee): string
    {
        $base = $employee->Email ?: "{$employee->idno}@hris.local";

        if (!User::where('email', $base)->exists()) {
            return $base;
        }

        // Fallback with suffix
        $suffix = 1;
        do {
            $candidate = "{$employee->idno}_{$suffix}@hris.local";
            $suffix++;
        } while (User::where('email', $candidate)->exists());

        return $candidate;
    }
}
