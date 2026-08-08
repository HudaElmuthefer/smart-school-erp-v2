<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role?->name === 'parent') {
            abort_if(!$user->student_id, 422, 'لا يوجد طالب مرتبط بهذا الحساب');
            $student = $user->student;

            $quizzes = Quiz::where('school_id', $student->school_id)
                ->where('section_id', $student->section_id)
                ->withCount('questions')
                ->with(['subject', 'attempts' => fn ($q) => $q->where('student_id', $student->id)])
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($quiz) {
                    $quiz->my_attempt = $quiz->attempts->first();
                    unset($quiz->attempts);

                    return $quiz;
                });

            return response()->json(['quizzes' => $quizzes]);
        }

        $schoolId = $this->requireSchoolId($request);
        $query = Quiz::where('school_id', $schoolId)->withCount(['questions', 'attempts'])->with(['subject', 'section']);

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->integer('subject_id'));
        }

        return response()->json(['quizzes' => $query->orderByDesc('created_at')->get()]);
    }

    /** يعرض تفاصيل الاختبار مع الأسئلة؛ يخفي الإجابة الصحيحة عن ولي الأمر لمنع الغش */
    public function show(Request $request, Quiz $quiz)
    {
        $user = $request->user();
        $isParent = $user->role?->name === 'parent';

        if ($isParent) {
            abort_if($user->student?->section_id !== $quiz->section_id, 403, 'هذا الاختبار ليس لشعبة ابنك');
        } else {
            $this->assertBelongsToUserSchool($request, $quiz->school_id);
        }

        $quiz->load('questions');
        if ($isParent) {
            $quiz->questions->each(fn ($q) => $q->makeHidden('correct_option'));
        }

        return response()->json(['quiz' => $quiz]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'title' => ['required', 'string', 'max:255'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*' => ['required', 'string'],
            'questions.*.correct_option' => ['required', 'integer', 'min:0'],
            'questions.*.points' => ['nullable', 'integer', 'min:1'],
        ]);

        $quiz = DB::transaction(function () use ($data, $schoolId, $request) {
            $quiz = Quiz::create([
                'school_id' => $schoolId,
                'subject_id' => $data['subject_id'],
                'section_id' => $data['section_id'],
                'lesson_id' => $data['lesson_id'] ?? null,
                'teacher_id' => Teacher::where('school_id', $schoolId)->where('user_id', $request->user()->id)->value('id'),
                'title' => $data['title'],
            ]);

            foreach ($data['questions'] as $q) {
                $quiz->questions()->create([
                    'question_text' => $q['question_text'],
                    'options' => $q['options'],
                    'correct_option' => $q['correct_option'],
                    'points' => $q['points'] ?? 1,
                ]);
            }

            return $quiz;
        });

        return response()->json(['quiz' => $quiz->load(['subject', 'section', 'questions'])], 201);
    }

    public function update(Request $request, Quiz $quiz)
    {
        $this->assertBelongsToUserSchool($request, $quiz->school_id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
        ]);
        $quiz->update($data);

        return response()->json(['quiz' => $quiz->fresh(['subject', 'section'])]);
    }

    public function destroy(Request $request, Quiz $quiz)
    {
        $this->assertBelongsToUserSchool($request, $quiz->school_id);
        $quiz->delete();

        return response()->json(['message' => 'تم حذف الاختبار']);
    }

    /** كشف نتائج كل طلاب الشعبة (للمعلم/الإدارة) */
    public function roster(Request $request, Quiz $quiz)
    {
        $this->assertBelongsToUserSchool($request, $quiz->school_id);

        $quiz->load(['section.students', 'attempts']);
        $maxScore = $quiz->questions()->sum('points');
        $attemptsByStudent = $quiz->attempts->keyBy('student_id');

        $roster = $quiz->section->students->map(fn ($student) => [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'attempt' => $attemptsByStudent->get($student->id),
        ]);

        return response()->json(['roster' => $roster, 'max_score' => $maxScore]);
    }
}
