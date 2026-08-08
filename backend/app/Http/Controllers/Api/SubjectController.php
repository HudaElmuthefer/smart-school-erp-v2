<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json(['subjects' => Subject::where('school_id', $schoolId)->orderBy('name_ar')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
        ]);
        $data['school_id'] = $schoolId;

        return response()->json(['subject' => Subject::create($data)], 201);
    }

    public function update(Request $request, Subject $subject)
    {
        $this->assertBelongsToUserSchool($request, $subject->school_id);

        $data = $request->validate([
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'name_en' => ['sometimes', 'string', 'max:255'],
        ]);
        $subject->update($data);

        return response()->json(['subject' => $subject]);
    }

    public function destroy(Request $request, Subject $subject)
    {
        $this->assertBelongsToUserSchool($request, $subject->school_id);
        $subject->delete();

        return response()->json(['message' => 'تم الحذف']);
    }
}
