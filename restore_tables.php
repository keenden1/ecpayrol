<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Restoring deleted tables...\n\n";

if (!Schema::hasTable('departments')) {
    echo "Creating departments table...\n";
    Schema::create('departments', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('code')->unique();
        $table->text('description')->nullable();
        $table->boolean('is_active')->default(true);
        $table->foreignId('created_by')->nullable()->constrained('users');
        $table->foreignId('updated_by')->nullable()->constrained('users');
        $table->timestamps();
    });
    echo "Departments table created successfully.\n";
} else {
    echo "Departments table already exists.\n";
}

if (!Schema::hasTable('employees')) {
    echo "Creating employees table...\n";
    Schema::create('employees', function (Blueprint $table) {
        $table->id();
        $table->string('idno')->unique();
        $table->string('bid')->nullable();
        $table->string('Lname');
        $table->string('Fname');
        $table->string('MName')->nullable();
        $table->string('Suffix')->nullable();
        $table->string('Gender');
        $table->string('EducationalAttainment')->nullable();
        $table->string('Degree')->nullable();
        $table->string('CivilStatus')->nullable();
        $table->date('Birthdate')->nullable();
        $table->string('ContactNo')->nullable();
        $table->string('Email')->nullable();
        $table->text('PresentAddress')->nullable();
        $table->text('PermanentAddress')->nullable();
        $table->string('EmerContactName')->nullable();
        $table->string('EmerContactNo')->nullable();
        $table->string('EmerRelationship')->nullable();
        $table->string('EmpStatus')->nullable();
        $table->string('JobStatus');
        $table->string('RankFile')->nullable();
        $table->string('Department')->nullable();
        $table->string('Line')->nullable();
        $table->string('Jobtitle')->nullable();
        $table->date('HiredDate')->nullable();
        $table->date('EndOfContract')->nullable();
        $table->string('pay_type')->nullable();
        $table->decimal('payrate', 10, 2)->nullable();
        $table->decimal('pay_allowance', 10, 2)->nullable();
        $table->string('SSSNO')->nullable();
        $table->string('PHILHEALTHNo')->nullable();
        $table->string('HDMFNo')->nullable();
        $table->string('TaxNo')->nullable();
        $table->boolean('Taxable')->default(true);
        $table->string('CostCenter')->nullable();
        $table->timestamps();
    });
    echo "Employees table created successfully.\n";
} else {
    echo "Employees table already exists.\n";
}

echo "\nDone! Tables have been restored.\n";
