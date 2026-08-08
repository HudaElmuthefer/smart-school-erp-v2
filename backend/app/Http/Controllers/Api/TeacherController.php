<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json([
            'teachers' => Teacher::where('school_id', $schoolId)->with('user')->get(),
        ]);
    }

    /** ينشئ المعلم وحسابه الموحّد للدخول معاً */
    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'specialization' => ['nullable', 'string', 'max:255'],
        ]);

        $teacher = DB::transaction(function () use ($data, $schoolId) {
            $teacherRoleId = Role::where('name', 'teacher')->value('id');

            $user = User::create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role_id' => $teacherRoleId,
                'school_id' => $schoolId,
            ]);

            return Teacher::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'specialization' => $data['specialization'] ?? null,
            ]);
        });

        return response()->json(['teacher' => $teacher->load('user')], 201);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $this->assertBelongsToUserSchool($request, $teacher->school_id);

        $data = $request->validate([
            'specialization' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
        $teacher->update($data);

        return response()->json(['teacher' => $teacher->fresh('user')]);
    }

    public function destroy(Request $request, Teacher $teacher)
    {
        $this->assertBelongsToUserSchool($request, $teacher->school_id);
        $teacher->user?->update(['is_active' => false]);
        $teacher->delete();

        return response()->json(['message' => 'تم حذف المعلم']);
    }
}
