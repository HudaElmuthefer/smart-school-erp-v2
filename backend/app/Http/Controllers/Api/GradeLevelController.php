<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use Illuminate\Http\Request;

class GradeLevelController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json([
            'grade_levels' => GradeLevel::where('school_id', $schoolId)->orderBy('order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'order' => ['required', 'integer'],
        ]);
        $data['school_id'] = $schoolId;

        return response()->json(['grade_level' => GradeLevel::create($data)], 201);
    }

    public function update(Request $request, GradeLevel $gradeLevel)
    {
        $this->assertBelongsToUserSchool($request, $gradeLevel->school_id);

        $data = $request->validate([
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'name_en' => ['sometimes', 'string', 'max:255'],
            'order' => ['sometimes', 'integer'],
        ]);
        $gradeLevel->update($data);

        return response()->json(['grade_level' => $gradeLevel]);
    }

    public function destroy(Request $request, GradeLevel $gradeLevel)
    {
        $this->assertBelongsToUserSchool($request, $gradeLevel->school_id);
        $gradeLevel->delete();

        return response()->json(['message' => 'تم الحذف']);
    }
}
