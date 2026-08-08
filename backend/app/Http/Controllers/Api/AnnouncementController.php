<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ScopesToSchool;

    /** متاح لكل الأدوار المصادَقة، ويُفلتَر حسب دور المستخدم؛ target_roles = null تعني "للجميع" */
    public function index(Request $request)
    {
        $user = $request->user();
        $schoolId = $user->isSuperAdmin() ? $request->integer('school_id') : $user->school_id;
        abort_if($schoolId === null, 422, 'يجب تحديد الفرع (school_id)');

        $announcements = Announcement::where('school_id', $schoolId)
            ->orderByDesc('event_date')
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($a) => empty($a->target_roles) || in_array($user->role?->name, $a->target_roles, true))
            ->values();

        return response()->json(['announcements' => $announcements]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'body_ar' => ['required', 'string'],
            'body_en' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'target_roles' => ['nullable', 'array'],
            'target_roles.*' => ['string', 'in:super_admin,admin,teacher,staff,parent,accountant,hr'],
        ]);
        $data['school_id'] = $schoolId;
        $data['created_by'] = $request->user()->id;

        $announcement = Announcement::create($data);

        return response()->json(['announcement' => $announcement], 201);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $this->assertBelongsToUserSchool($request, $announcement->school_id);

        $data = $request->validate([
            'title_ar' => ['sometimes', 'string', 'max:255'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body_ar' => ['sometimes', 'string'],
            'body_en' => ['sometimes', 'nullable', 'string'],
            'event_date' => ['sometimes', 'nullable', 'date'],
            'target_roles' => ['sometimes', 'nullable', 'array'],
        ]);
        $announcement->update($data);

        return response()->json(['announcement' => $announcement->fresh()]);
    }

    public function destroy(Request $request, Announcement $announcement)
    {
        $this->assertBelongsToUserSchool($request, $announcement->school_id);
        $announcement->delete();

        return response()->json(['message' => 'تم حذف الإعلان']);
    }
}
