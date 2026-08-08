<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'هذا الإجراء متاح للمدير العام فقط');

        return response()->json(['schools' => School::orderBy('id')->get()]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'هذا الإجراء متاح للمدير العام فقط');

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'school_type' => ['required', 'in:private,public'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $school = School::create($data);

        return response()->json(['school' => $school], 201);
    }

    public function update(Request $request, School $school)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'هذا الإجراء متاح للمدير العام فقط');

        $data = $request->validate([
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'school_type' => ['sometimes', 'in:private,public'],
            'is_active' => ['sometimes', 'boolean'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
        ]);

        $school->update($data);

        return response()->json(['school' => $school->fresh()]);
    }

    public function destroy(Request $request, School $school)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'هذا الإجراء متاح للمدير العام فقط');

        $school->delete();

        return response()->json(['message' => 'تم حذف الفرع']);
    }
}
