<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GradeLevelController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolSettingsController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/school-settings', [SchoolSettingsController::class, 'show']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::put('/school-settings', [SchoolSettingsController::class, 'update']);

    Route::get('/schools', [SchoolController::class, 'index']);
    Route::post('/schools', [SchoolController::class, 'store']);
    Route::put('/schools/{school}', [SchoolController::class, 'update']);
    Route::delete('/schools/{school}', [SchoolController::class, 'destroy']);

    Route::apiResource('grade-levels', GradeLevelController::class)
        ->except(['show'])
        ->parameters(['grade-levels' => 'gradeLevel']);
    Route::apiResource('sections', SectionController::class)->except(['show']);
    Route::apiResource('subjects', SubjectController::class)->except(['show']);
    Route::apiResource('students', StudentController::class);
});
