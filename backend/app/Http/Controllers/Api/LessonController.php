<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Teacher;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role?->name === 'parent') {
            abort_if(!$user->student_id, 422, 'لا يوجد طالب مرتبط بهذا الحساب');
            $student = $user->student;

            $lessons = Lesson::where('school_id', $student->school_id)
                ->where('section_id', $student->section_id)
                ->with('subject')
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['lessons' => $lessons]);
        }

        $schoolId = $this->requireSchoolId($request);
        $query = Lesson::where('school_id', $schoolId)->with(['subject', 'section']);

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->integer('subject_id'));
        }

        return response()->json(['lessons' => $query->orderByDesc('created_at')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);
        $data['school_id'] = $schoolId;
        $data['teacher_id'] = Teacher::where('school_id', $schoolId)->where('user_id', $request->user()->id)->value('id');

        $lesson = Lesson::create($data);

        return response()->json(['lesson' => $lesson->load(['subject', 'section'])], 201);
    }

    public function update(Request $request, Lesson $lesson)
    {
        $this->assertBelongsToUserSchool($request, $lesson->school_id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string'],
        ]);
        $lesson->update($data);

        return response()->json(['lesson' => $lesson->fresh(['subject', 'section'])]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $this->assertBelongsToUserSchool($request, $lesson->school_id);
        $lesson->delete();

        return response()->json(['message' => 'تم حذف الدرس']);
    }
}
