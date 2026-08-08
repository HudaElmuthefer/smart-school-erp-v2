<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });

        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->string('app_name_ar')->nullable();
            $table->string('app_name_en')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('primary_color')->default('#0F1A2B');
            $table->string('primary_color_dark')->default('#C9942A');
            $table->string('school_type')->default('private');
            $table->decimal('passing_grade', 5, 2)->default(50);
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('extra_settings')->nullable();
            $table->string('login_tagline_ar')->nullable();
            $table->string('login_tagline_en')->nullable();
            $table->string('dashboard_quote_ar')->nullable();
            $table->string('dashboard_quote_en')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
        Schema::dropIfExists('roles');
    }
};
