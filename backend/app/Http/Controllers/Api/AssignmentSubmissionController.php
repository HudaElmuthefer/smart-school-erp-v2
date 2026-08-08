<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class AssignmentSubmissionController extends Controller
{
    /** يسلّم ولي الأمر الواجب نيابةً عن ابنه المرتبط بحسابه */
    public function store(Request $request, Assignment $assignment)
    {
        $user = $request->user();
        abort_if($user->role?->name !== 'parent' || !$user->student_id, 403, 'هذا الإجراء متاح لحساب ولي الأمر فقط');

        $student = $user->student;
        abort_if($student->section_id !== $assignment->section_id, 403, 'هذا الواجب ليس لشعبة ابنك');

        $data = $request->validate([
            'submission_text' => ['required', 'string'],
        ]);

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'student_id' => $student->id],
            [
                'school_id' => $assignment->school_id,
                'submission_text' => $data['submission_text'],
                'submitted_at' => now(),
                'score' => null,
                'teacher_feedback' => null,
                'graded_by' => null,
                'graded_at' => null,
            ]
        );

        return response()->json(['submission' => $submission], 201);
    }

    /** يصحّح المعلم/الإدارة تسليم طالب معيّن */
    public function grade(Request $request, AssignmentSubmission $submission)
    {
        $user = $request->user();
        abort_if(!$user->isSuperAdmin() && $user->school_id !== $submission->school_id, 403, 'غير مصرح بالوصول لهذا الفرع');

        $data = $request->validate([
            'score' => ['required', 'numeric', 'min:0', 'max:100'],
            'teacher_feedback' => ['nullable', 'string'],
        ]);

        $submission->update([
            'score' => $data['score'],
            'teacher_feedback' => $data['teacher_feedback'] ?? null,
            'graded_by' => $user->id,
            'graded_at' => now(),
        ]);

        return response()->json(['submission' => $submission]);
    }
}
