<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = Section::where('school_id', $schoolId)->with('gradeLevel');

        if ($request->filled('grade_level_id')) {
            $query->where('grade_level_id', $request->integer('grade_level_id'));
        }

        return response()->json(['sections' => $query->orderBy('name_ar')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'grade_level_id' => ['required', 'integer', 'exists:grade_levels,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
        ]);
        $data['school_id'] = $schoolId;

        return response()->json(['section' => Section::create($data)->load('gradeLevel')], 201);
    }

    public function update(Request $request, Section $section)
    {
        $this->assertBelongsToUserSchool($request, $section->school_id);

        $data = $request->validate([
            'grade_level_id' => ['sometimes', 'integer', 'exists:grade_levels,id'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'name_en' => ['sometimes', 'string', 'max:255'],
        ]);
        $section->update($data);

        return response()->json(['section' => $section->fresh('gradeLevel')]);
    }

    public function destroy(Request $request, Section $section)
    {
        $this->assertBelongsToUserSchool($request, $section->school_id);
        $section->delete();

        return response()->json(['message' => 'تم الحذف']);
    }
}
