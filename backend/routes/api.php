<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AssignmentSubmissionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BiometricDeviceController;
use App\Http\Controllers\Api\GradeLevelController;
use App\Http\Controllers\Api\GradeReportController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\MonthlyScoreController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolSettingsController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TermScoreController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/school-settings', [SchoolSettingsController::class, 'show']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // متاح لولي الأمر أيضاً (يفلتر داخلياً حسب الدور) ولباقي الطاقم
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'store']);

    Route::get('/lessons', [LessonController::class, 'index']);
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::post('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'store']);

    Route::middleware('staff')->group(function () {
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
        Route::post('/students/{student}/guardian-account', [StudentController::class, 'createGuardianAccount']);
        Route::apiResource('teachers', TeacherController::class)->except(['show']);
        Route::apiResource('staff', StaffController::class)
            ->except(['show'])
            ->parameters(['staff' => 'staffMember']);

        Route::apiResource('biometric-devices', BiometricDeviceController::class)
            ->except(['show'])
            ->parameters(['biometric-devices' => 'device']);
        Route::get('/attendances', [AttendanceController::class, 'index']);
        Route::post('/attendances', [AttendanceController::class, 'store']);

        Route::apiResource('academic-years', AcademicYearController::class)
            ->except(['show'])
            ->parameters(['academic-years' => 'academicYear']);
        Route::get('/monthly-scores', [MonthlyScoreController::class, 'index']);
        Route::post('/monthly-scores', [MonthlyScoreController::class, 'upsert']);
        Route::post('/term-scores', [TermScoreController::class, 'upsert']);
        Route::get('/grade-reports/section', [GradeReportController::class, 'forSection']);
        Route::get('/grade-reports/students/{student}', [GradeReportController::class, 'forStudent']);

        Route::post('/assignments', [AssignmentController::class, 'store']);
        Route::put('/assignments/{assignment}', [AssignmentController::class, 'update']);
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy']);
        Route::get('/assignments/{assignment}/roster', [AssignmentController::class, 'roster']);
        Route::put('/assignment-submissions/{submission}/grade', [AssignmentSubmissionController::class, 'grade']);

        Route::post('/lessons', [LessonController::class, 'store']);
        Route::put('/lessons/{lesson}', [LessonController::class, 'update']);
        Route::delete('/lessons/{lesson}', [LessonController::class, 'destroy']);

        Route::post('/quizzes', [QuizController::class, 'store']);
        Route::put('/quizzes/{quiz}', [QuizController::class, 'update']);
        Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);
        Route::get('/quizzes/{quiz}/roster', [QuizController::class, 'roster']);
    });
});
