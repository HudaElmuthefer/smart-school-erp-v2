<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\MonthlyScore;
use Illuminate\Http\Request;

class MonthlyScoreController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'subject_id' => ['required', 'integer'],
            'academic_month_id' => ['required', 'integer'],
            'section_id' => ['required', 'integer'],
        ]);

        $scores = MonthlyScore::where('school_id', $schoolId)
            ->where('subject_id', $data['subject_id'])
            ->where('academic_month_id', $data['academic_month_id'])
            ->whereHas('student', fn ($q) => $q->where('section_id', $data['section_id']))
            ->get()
            ->keyBy('student_id');

        return response()->json(['scores' => $scores->values()]);
    }

    /**
     * دمج جزئي عمداً: الواجهة ترسل حقلاً واحداً فقط في كل مرة (عند onBlur لكل خانة)،
     * فيجب ألا يمسح الحقلين الآخرين المحفوظين مسبقاً لنفس السجل.
     */
    public function upsert(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_month_id' => ['required', 'integer', 'exists:academic_months,id'],
            'daily_exam_score' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'monthly_exam_score' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'daily_preparation_score' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $score = MonthlyScore::firstOrNew([
            'student_id' => $data['student_id'],
            'subject_id' => $data['subject_id'],
            'academic_month_id' => $data['academic_month_id'],
        ]);
        $score->school_id = $schoolId;
        $score->created_by = $request->user()->id;

        foreach (['daily_exam_score', 'monthly_exam_score', 'daily_preparation_score'] as $field) {
            if (array_key_exists($field, $data)) {
                $score->{$field} = $data[$field];
            }
        }

        $score->save();

        return response()->json(['score' => $score, 'month_average' => $score->month_average]);
    }
}
