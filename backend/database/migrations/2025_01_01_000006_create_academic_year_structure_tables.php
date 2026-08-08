<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->enum('type', ['first_term', 'second_term', 'mid_year', 'final_exam']);
            $table->smallInteger('order');
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['academic_year_id', 'type']);
        });

        Schema::create('academic_months', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->smallInteger('month_number');
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['academic_term_id', 'month_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_months');
        Schema::dropIfExists('academic_terms');
        Schema::dropIfExists('academic_years');
    }
};
