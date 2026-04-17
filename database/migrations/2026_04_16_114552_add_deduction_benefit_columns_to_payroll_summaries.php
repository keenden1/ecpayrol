<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_summaries', function (Blueprint $table) {
            $cols = [
                'advance', 'charge_store', 'charge', 'meals',
                'miscellaneous', 'other_deductions', 'mf_shares',
                'mf_loan', 'sss_loan', 'hmdf_loan', 'hmdf_prem',
                'sss_prem', 'philhealth', 'allowances',
            ];

            foreach ($cols as $col) {
                if (!Schema::hasColumn('payroll_summaries', $col)) {
                    $table->decimal($col, 10, 2)->default(0);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('payroll_summaries', function (Blueprint $table) {
            $cols = [
                'advance', 'charge_store', 'charge', 'meals',
                'miscellaneous', 'other_deductions', 'mf_shares',
                'mf_loan', 'sss_loan', 'hmdf_loan', 'hmdf_prem',
                'sss_prem', 'philhealth', 'allowances',
            ];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('payroll_summaries', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
