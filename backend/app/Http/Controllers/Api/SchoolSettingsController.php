<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SchoolSettingsController extends Controller
{
    use ScopesToSchool;

    /**
     * Public, unauthenticated: branding shown on the login page before the
     * user identifies themselves. Defaults to the first branch (id=1).
     */
    public function show()
    {
        $school = School::find(1);

        return response()->json(['school' => $school]);
    }

    public function update(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $school = School::findOrFail($schoolId);

        $data = $request->validate([
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'app_name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'app_name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'primary_color' => ['sometimes', 'string', 'max:32'],
            'primary_color_dark' => ['sometimes', 'string', 'max:32'],
            'school_type' => ['sometimes', 'string', 'max:32'],
            'passing_grade' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'login_tagline_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'login_tagline_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'dashboard_quote_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'dashboard_quote_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'extra_settings' => ['sometimes', 'array'],
        ]);

        // extra_settings يُدمَج بدل الاستبدال الكامل حتى لا يمحو تبويب (مثل الطباعة) ما حفظه تبويب آخر (مثل النظام)
        if (array_key_exists('extra_settings', $data)) {
            $data['extra_settings'] = array_merge($school->extra_settings ?? [], $data['extra_settings']);
        }

        $school->update($data);

        return response()->json(['school' => $school->fresh()]);
    }

    public function uploadLogo(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $school = School::findOrFail($schoolId);

        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        if ($school->logo_path) {
            Storage::disk('public')->delete($school->logo_path);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $school->update(['logo_path' => $path]);

        return response()->json(['school' => $school->fresh(), 'logo_url' => Storage::disk('public')->url($path)]);
    }
}
