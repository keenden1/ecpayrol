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
        Schema::create('biometric_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('biometric_devices')->onDelete('cascade');
            $table->foreignId('initiated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['pending', 'fetching', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('total_logs')->default(0);
            $table->integer('processed_logs')->default(0);
            $table->integer('skipped_logs')->default(0);
            $table->integer('saved_records')->default(0);
            $table->integer('updated_records')->default(0);
            $table->text('current_stage')->nullable();
            $table->text('error_message')->nullable();
            $table->json('unmatched_employees')->nullable(); // Store biometric IDs not found in system
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['device_id', 'status']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biometric_sync_logs');
    }
};
