<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\UserSectionAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * كل مفاتيح الأقسام المعروضة بالقائمة الجانبية الرئيسية (AppLayout.tsx) مع من يصل إليها افتراضياً حسب الدور،
 * لتوليد وسوم صلاحيات واقعية لكل مستخدم جديد. هذا الجدول عرض/إدارة فقط حالياً — لا يُستخدم لفرض
 * الصلاحيات داخل الوحدات الـ16 نفسها حتى لا يُعاد فتح منطقها المبني والمختبر مسبقاً.
 */
class UserController extends Controller
{
    use ScopesToSchool;

    public const ALL_SECTIONS = [
        'home', 'announcements', 'messages', 'students', 'academic', 'teachers', 'attendance', 'grades',
        'assignments', 'lms', 'staff', 'finance', 'installments', 'inventory', 'exportImport',
        'backups', 'aiChat', 'earlyWarning', 'schools', 'settings',
    ];

    /** إدارة المستخدمين والصلاحيات عملية حسّاسة، تُقصر على المدير العام/مدير الفرع فقط */
    protected function assertCanManageUsers(Request $request): void
    {
        $role = $request->user()->role?->name;
        abort_if(!in_array($role, ['super_admin', 'admin'], true), 403, 'هذا الإجراء متاح للمدير فقط');
    }

    protected function defaultSectionsForRole(?string $role): array
    {
        return match ($role) {
            'parent' => ['home', 'announcements', 'messages', 'assignments', 'lms', 'aiChat'],
            'super_admin' => self::ALL_SECTIONS,
            'admin' => array_values(array_diff(self::ALL_SECTIONS, ['aiChat', 'schools'])),
            default => array_values(array_diff(self::ALL_SECTIONS, ['aiChat', 'schools', 'backups'])),
        };
    }

    public function index(Request $request)
    {
        $this->assertCanManageUsers($request);
        $schoolId = $this->requireSchoolId($request);

        $users = User::where('school_id', $schoolId)
            ->with('role')
            ->orderBy('full_name')
            ->get()
            ->map(fn (User $u) => $this->format($u));

        return response()->json(['users' => $users, 'available_sections' => self::ALL_SECTIONS]);
    }

    public function store(Request $request)
    {
        $this->assertCanManageUsers($request);
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
        ]);

        $user = DB::transaction(function () use ($data, $schoolId) {
            $user = User::create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role_id' => $data['role_id'],
                'school_id' => $schoolId,
            ]);

            $roleName = Role::find($data['role_id'])?->name;
            foreach ($this->defaultSectionsForRole($roleName) as $section) {
                UserSectionAccess::create(['user_id' => $user->id, 'section_key' => $section]);
            }

            return $user;
        });

        return response()->json(['user' => $this->format($user->load('role'))], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->assertCanManageUsers($request);
        $this->assertBelongsToUserSchool($request, $user->school_id);

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role_id' => ['sometimes', 'integer', 'exists:roles,id'],
        ]);
        $user->update($data);

        return response()->json(['user' => $this->format($user->fresh('role'))]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->assertCanManageUsers($request);
        $this->assertBelongsToUserSchool($request, $user->school_id);
        abort_if($user->id === $request->user()->id, 422, 'لا يمكنك حذف حسابك الخاص');

        $user->delete();

        return response()->json(['message' => 'تم حذف المستخدم']);
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->assertCanManageUsers($request);
        $this->assertBelongsToUserSchool($request, $user->school_id);

        $data = $request->validate([
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $newPassword = $data['password'] ?? Str::random(10);
        $user->update(['password' => $newPassword]);

        return response()->json(['message' => 'تم تعيين كلمة مرور جديدة', 'new_password' => $newPassword]);
    }

    /** تبديل وصول المستخدم إلى قسم معيّن (إضافة/إزالة وسم صلاحية) */
    public function togglePermission(Request $request, User $user)
    {
        $this->assertCanManageUsers($request);
        $this->assertBelongsToUserSchool($request, $user->school_id);

        $data = $request->validate([
            'section_key' => ['required', 'string', 'in:'.implode(',', self::ALL_SECTIONS)],
        ]);

        $existing = UserSectionAccess::where('user_id', $user->id)->where('section_key', $data['section_key'])->first();
        if ($existing) {
            $existing->delete();
            $granted = false;
        } else {
            UserSectionAccess::create(['user_id' => $user->id, 'section_key' => $data['section_key']]);
            $granted = true;
        }

        return response()->json(['section_key' => $data['section_key'], 'granted' => $granted]);
    }

    protected function format(User $user): array
    {
        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'role' => $user->role?->name,
            'role_ar' => $user->role?->name_ar,
            'is_active' => $user->is_active,
            'sections' => UserSectionAccess::where('user_id', $user->id)->pluck('section_key'),
        ];
    }
}
