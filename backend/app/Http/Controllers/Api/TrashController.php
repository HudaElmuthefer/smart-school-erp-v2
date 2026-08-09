<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Account;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\FeePlan;
use App\Models\GradeLevel;
use App\Models\Item;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    use ScopesToSchool;

    /** استرجاع/حذف نهائي عملية حسّاسة، تُقصر على المدير العام/مدير الفرع فقط */
    protected function assertCanManageTrash(Request $request): void
    {
        $role = $request->user()->role?->name;
        abort_if(!in_array($role, ['super_admin', 'admin'], true), 403, 'هذا الإجراء متاح للمدير فقط');
    }

    protected function registry(): array
    {
        return [
            'students' => ['label' => 'الطلاب', 'class' => Student::class, 'name' => fn ($m) => $m->full_name],
            'teachers' => ['label' => 'المعلمون', 'class' => Teacher::class, 'name' => fn ($m) => $m->user?->full_name ?? ('#'.$m->id)],
            'staff' => ['label' => 'الموظفون', 'class' => Staff::class, 'name' => fn ($m) => $m->user?->full_name ?? ('#'.$m->id)],
            'users' => ['label' => 'المستخدمون', 'class' => User::class, 'name' => fn ($m) => $m->full_name],
            'sections' => ['label' => 'الشعب', 'class' => Section::class, 'name' => fn ($m) => $m->name_ar],
            'subjects' => ['label' => 'المواد', 'class' => Subject::class, 'name' => fn ($m) => $m->name_ar],
            'grade_levels' => ['label' => 'المراحل الدراسية', 'class' => GradeLevel::class, 'name' => fn ($m) => $m->name_ar],
            'assignments' => ['label' => 'الواجبات', 'class' => Assignment::class, 'name' => fn ($m) => $m->title],
            'lessons' => ['label' => 'الدروس', 'class' => Lesson::class, 'name' => fn ($m) => $m->title],
            'quizzes' => ['label' => 'الاختبارات', 'class' => Quiz::class, 'name' => fn ($m) => $m->title],
            'announcements' => ['label' => 'الإعلانات', 'class' => Announcement::class, 'name' => fn ($m) => $m->title_ar],
            'items' => ['label' => 'أصناف المخزون', 'class' => Item::class, 'name' => fn ($m) => $m->name],
            'accounts' => ['label' => 'الحسابات المالية', 'class' => Account::class, 'name' => fn ($m) => $m->name],
            'academic_years' => ['label' => 'السنوات الدراسية', 'class' => AcademicYear::class, 'name' => fn ($m) => $m->name],
            'fee_plans' => ['label' => 'خطط الأقساط', 'class' => FeePlan::class, 'name' => fn ($m) => $m->academic_year_label],
        ];
    }

    public function index(Request $request)
    {
        $this->assertCanManageTrash($request);
        $schoolId = $this->requireSchoolId($request);
        $items = collect();

        foreach ($this->registry() as $type => $config) {
            $class = $config['class'];
            $query = $class::onlyTrashed()->where('school_id', $schoolId);
            if ($type === 'teachers' || $type === 'staff') {
                $query->with('user');
            }

            foreach ($query->get() as $model) {
                $items->push([
                    'type' => $type,
                    'type_label' => $config['label'],
                    'id' => $model->id,
                    'name' => $config['name']($model) ?? "#{$model->id}",
                    'deleted_at' => $model->deleted_at,
                ]);
            }
        }

        return response()->json(['trash' => $items->sortByDesc('deleted_at')->values()]);
    }

    public function restore(Request $request, string $type, int $id)
    {
        $this->assertCanManageTrash($request);
        $schoolId = $this->requireSchoolId($request);
        $config = $this->registry()[$type] ?? null;
        abort_if(!$config, 404, 'نوع غير معروف');

        $model = $config['class']::onlyTrashed()->where('school_id', $schoolId)->findOrFail($id);
        $model->restore();

        return response()->json(['message' => 'تم الاسترجاع']);
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        $this->assertCanManageTrash($request);
        $schoolId = $this->requireSchoolId($request);
        $config = $this->registry()[$type] ?? null;
        abort_if(!$config, 404, 'نوع غير معروف');

        $model = $config['class']::onlyTrashed()->where('school_id', $schoolId)->findOrFail($id);
        $model->forceDelete();

        return response()->json(['message' => 'تم الحذف النهائي']);
    }
}
