<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Teacher;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role?->name === 'parent') {
            abort_if(!$user->student_id, 422, 'لا يوجد طالب مرتبط بهذا الحساب');
            $student = $user->student;

            $assignments = Assignment::where('school_id', $student->school_id)
                ->where('section_id', $student->section_id)
                ->with(['subject', 'submissions' => fn ($q) => $q->where('student_id', $student->id)])
                ->orderByDesc('due_date')
                ->get()
                ->map(function ($assignment) {
                    $assignment->my_submission = $assignment->submissions->first();
                    unset($assignment->submissions);

                    return $assignment;
                });

            return response()->json(['assignments' => $assignments]);
        }

        $schoolId = $this->requireSchoolId($request);
        $query = Assignment::where('school_id', $schoolId)->with(['subject', 'section']);

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->integer('subject_id'));
        }

        return response()->json(['assignments' => $query->orderByDesc('due_date')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['required', 'date'],
        ]);
        $data['school_id'] = $schoolId;
        $data['teacher_id'] = Teacher::where('school_id', $schoolId)->where('user_id', $request->user()->id)->value('id');

        $assignment = Assignment::create($data);

        return response()->json(['assignment' => $assignment->load(['subject', 'section'])], 201);
    }

    public function update(Request $request, Assignment $assignment)
    {
        $this->assertBelongsToUserSchool($request, $assignment->school_id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'due_date' => ['sometimes', 'date'],
        ]);
        $assignment->update($data);

        return response()->json(['assignment' => $assignment->fresh(['subject', 'section'])]);
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $this->assertBelongsToUserSchool($request, $assignment->school_id);
        $assignment->delete();

        return response()->json(['message' => 'تم حذف الواجب']);
    }

    /** كشف تسليم لكل طلاب الشعبة (للمعلم/الإدارة) */
    public function roster(Request $request, Assignment $assignment)
    {
        $this->assertBelongsToUserSchool($request, $assignment->school_id);

        $assignment->load(['section.students', 'submissions']);
        $submissionsByStudent = $assignment->submissions->keyBy('student_id');

        $roster = $assignment->section->students->map(fn ($student) => [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'submission' => $submissionsByStudent->get($student->id),
        ]);

        return response()->json(['roster' => $roster]);
    }
}
