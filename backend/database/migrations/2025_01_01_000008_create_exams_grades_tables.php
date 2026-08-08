<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_month_id')->constrained('academic_months')->cascadeOnDelete();
            $table->decimal('daily_exam_score', 5, 2)->nullable();
            $table->decimal('monthly_exam_score', 5, 2)->nullable();
            $table->decimal('daily_preparation_score', 5, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->unique(['student_id', 'subject_id', 'academic_month_id'], 'monthly_scores_unique');
        });

        Schema::create('term_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->unique(['student_id', 'subject_id', 'academic_term_id'], 'term_scores_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('term_scores');
        Schema::dropIfExists('monthly_scores');
    }
};
