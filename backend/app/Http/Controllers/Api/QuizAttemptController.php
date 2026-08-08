<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class QuizAttemptController extends Controller
{
    /** يخوض ولي الأمر الاختبار نيابةً عن ابنه؛ التصحيح تلقائي فوري */
    public function store(Request $request, Quiz $quiz)
    {
        $user = $request->user();
        abort_if($user->role?->name !== 'parent' || !$user->student_id, 403, 'هذا الإجراء متاح لحساب ولي الأمر فقط');

        $student = $user->student;
        abort_if($student->section_id !== $quiz->section_id, 403, 'هذا الاختبار ليس لشعبة ابنك');

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'integer', 'min:0'],
        ]);

        $quiz->load('questions');
        $maxScore = $quiz->questions->sum('points');
        $earned = 0;

        foreach ($quiz->questions as $question) {
            $selected = $data['answers'][$question->id] ?? null;
            if ($selected !== null && (int) $selected === $question->correct_option) {
                $earned += $question->points;
            }
        }

        $score = $maxScore > 0 ? round(($earned / $maxScore) * 100, 2) : 0;

        $attempt = QuizAttempt::updateOrCreate(
            ['quiz_id' => $quiz->id, 'student_id' => $student->id],
            [
                'school_id' => $quiz->school_id,
                'answers' => $data['answers'],
                'score' => $score,
                'submitted_at' => now(),
            ]
        );

        return response()->json(['attempt' => $attempt, 'max_score' => $maxScore, 'earned_points' => $earned], 201);
    }
}
