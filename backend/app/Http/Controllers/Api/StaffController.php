<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json([
            'staff' => Staff::where('school_id', $schoolId)->with('user')->get(),
        ]);
    }

    /** ينشئ الموظف وحسابه الموحّد للدخول معاً */
    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'department' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'salary' => ['nullable', 'numeric', 'min:0'],
        ]);

        $staff = DB::transaction(function () use ($data, $schoolId) {
            $staffRoleId = Role::where('name', 'staff')->value('id');

            $user = User::create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role_id' => $staffRoleId,
                'school_id' => $schoolId,
            ]);

            return Staff::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'department' => $data['department'] ?? null,
                'job_title' => $data['job_title'] ?? null,
                'salary' => $data['salary'] ?? null,
            ]);
        });

        return response()->json(['staff' => $staff->load('user')], 201);
    }

    public function update(Request $request, Staff $staffMember)
    {
        $this->assertBelongsToUserSchool($request, $staffMember->school_id);

        $data = $request->validate([
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'salary' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);
        $staffMember->update($data);

        return response()->json(['staff' => $staffMember->fresh('user')]);
    }

    public function destroy(Request $request, Staff $staffMember)
    {
        $this->assertBelongsToUserSchool($request, $staffMember->school_id);
        $staffMember->user?->update(['is_active' => false]);
        $staffMember->delete();

        return response()->json(['message' => 'تم حذف الموظف']);
    }
}
