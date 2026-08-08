<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\TermScore;
use Illuminate\Http\Request;

class TermScoreController extends Controller
{
    use ScopesToSchool;

    public function upsert(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_term_id' => ['required', 'integer', 'exists:academic_terms,id'],
            'score' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $score = TermScore::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'subject_id' => $data['subject_id'],
                'academic_term_id' => $data['academic_term_id'],
            ],
            [
                'school_id' => $schoolId,
                'score' => $data['score'],
                'created_by' => $request->user()->id,
            ],
        );

        return response()->json(['score' => $score]);
    }
}
