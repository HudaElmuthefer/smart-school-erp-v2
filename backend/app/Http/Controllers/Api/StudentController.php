<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = Student::where('school_id', $schoolId)->with('section.gradeLevel');

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        }
        if ($request->filled('search')) {
            $query->where('full_name', 'ilike', '%'.$request->string('search').'%');
        }

        return response()->json(['students' => $query->orderBy('full_name')->paginate($request->integer('per_page', 20))]);
    }

    public function show(Request $request, Student $student)
    {
        $this->assertBelongsToUserSchool($request, $student->school_id);

        return response()->json(['student' => $student->load('section.gradeLevel')]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:255'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'date_of_birth' => ['nullable', 'date'],
        ]);
        $data['school_id'] = $schoolId;

        $student = Student::create($data);

        return response()->json(['student' => $student->load('section.gradeLevel')], 201);
    }

    public function update(Request $request, Student $student)
    {
        $this->assertBelongsToUserSchool($request, $student->school_id);

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'national_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'section_id' => ['sometimes', 'integer', 'exists:sections,id'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
        ]);
        $student->update($data);

        return response()->json(['student' => $student->fresh('section.gradeLevel')]);
    }

    public function destroy(Request $request, Student $student)
    {
        $this->assertBelongsToUserSchool($request, $student->school_id);
        $student->delete();

        return response()->json(['message' => 'تم حذف الطالب']);
    }
}
