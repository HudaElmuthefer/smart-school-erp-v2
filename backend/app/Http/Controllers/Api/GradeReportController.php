<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\Subject;
use App\Services\GradeCalculator;
use Illuminate\Http\Request;

class GradeReportController extends Controller
{
    use ScopesToSchool;

    /** سلسلة الدرجات الكاملة لكل طلاب شعبة بمادة واحدة — محسوبة حياً بلا تخزين */
    public function forSection(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'section_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'academic_year_id' => ['required', 'integer'],
        ]);

        $year = AcademicYear::where('school_id', $schoolId)
            ->with('terms.months')
            ->findOrFail($data['academic_year_id']);

        $students = Student::where('school_id', $schoolId)
            ->where('section_id', $data['section_id'])
            ->orderBy('full_name')
            ->get();

        $report = $students->map(function (Student $student) use ($data, $year) {
            $calculator = new GradeCalculator($student->id, $data['subject_id'], $year);

            return [
                'student_id' => $student->id,
                'student_name' => $student->full_name,
                ...$calculator->breakdown(),
            ];
        });

        return response()->json(['report' => $report]);
    }

    /** تقرير طالب واحد بكل المواد — تستخدمه واجهة ولي الأمر لعرض درجات ابنه فقط */
    public function forStudent(Request $request, Student $student)
    {
        $this->assertBelongsToUserSchool($request, $student->school_id);

        $user = $request->user();
        // لا يوجد تسجيل دخول للطالب؛ حساب ولي الأمر مربوط بـstudent_id، فيُقيَّد بابنه فقط
        abort_if($user->student_id !== null && $user->student_id !== $student->id, 403, 'يمكنك الاطلاع على درجات ابنك فقط');

        $year = AcademicYear::where('school_id', $student->school_id)
            ->where('is_current', true)
            ->with('terms.months')
            ->firstOrFail();

        $subjects = Subject::where('school_id', $student->school_id)->orderBy('name_ar')->get();

        $report = $subjects->map(function ($subject) use ($student, $year) {
            $calculator = new GradeCalculator($student->id, $subject->id, $year);

            return [
                'subject_id' => $subject->id,
                'subject_name' => $subject->name_ar,
                ...$calculator->breakdown(),
            ];
        });

        return response()->json(['academic_year' => $year->name, 'report' => $report]);
    }
}
