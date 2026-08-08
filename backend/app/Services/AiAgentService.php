<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Carbon;

class AiAgentService
{
    public function __construct(private GeminiClient $gemini)
    {
    }

    /** روبوت محادثة لولي الأمر، محصور ببيانات ابنه فقط */
    public function parentChat(User $parent, string $message): string
    {
        $student = $parent->student;
        abort_if(!$student, 422, 'لا يوجد طالب مرتبط بهذا الحساب');

        $context = $this->buildStudentContext($student);

        $prompt = <<<PROMPT
        أنت مساعد ذكي لنظام إدارة مدرسي، تتحدث مع ولي أمر طالب. أجب بالعربية، بإيجاز ووضوح،
        واستند فقط إلى البيانات المرفقة عن ابنه أدناه. إن لم تكفِ البيانات للإجابة، قل ذلك بصراحة
        بدل التخمين.

        بيانات الطالب:
        {$context}

        سؤال ولي الأمر: {$message}
        PROMPT;

        return $this->gemini->generate($prompt);
    }

    /** اقتراح تصحيح للمعلم بناءً على نص تسليم الواجب */
    public function suggestGrading(AssignmentSubmission $submission): array
    {
        $submission->loadMissing('assignment');
        $assignment = $submission->assignment;

        $prompt = <<<PROMPT
        أنت مساعد تصحيح لمعلم. عنوان الواجب: {$assignment->title}
        وصف الواجب: {$assignment->description}

        إجابة الطالب:
        {$submission->submission_text}

        اقترح درجة من 0 إلى 100 وملاحظة قصيرة (سطر أو سطرين) للطالب. أجب حصراً بالتنسيق التالي بلا أي نص إضافي:
        الدرجة: <رقم>
        الملاحظة: <النص>
        PROMPT;

        $response = $this->gemini->generate($prompt);

        $score = null;
        $feedback = null;
        if (preg_match('/الدرجة:\s*(\d+(\.\d+)?)/u', $response, $m)) {
            $score = min(100, max(0, (float) $m[1]));
        }
        if (preg_match('/الملاحظة:\s*(.+)/us', $response, $m)) {
            $feedback = trim($m[1]);
        }

        return ['suggested_score' => $score, 'suggested_feedback' => $feedback, 'raw' => $response];
    }

    /** فحص إحصائي (بلا ذكاء اصطناعي) لرصد الطلاب المعرّضين لخطر أكاديمي مبكراً */
    public function earlyWarningScan(int $schoolId): array
    {
        $year = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->with('terms.months')->first();
        if (!$year) {
            return [];
        }

        $students = Student::where('school_id', $schoolId)->get();
        $subjects = Subject::where('school_id', $schoolId)->get();
        $monthAgo = Carbon::now()->subDays(30);

        $flags = [];

        foreach ($students as $student) {
            $reasons = [];

            $averages = $subjects->map(fn ($subject) => (new GradeCalculator($student->id, $subject->id, $year))->finalAverage())
                ->filter(fn ($v) => $v !== null);

            if ($averages->isNotEmpty() && $averages->avg() < 60) {
                $reasons[] = 'المعدل العام أقل من 60 ('.round($averages->avg(), 1).')';
            }

            $recentAttendance = Attendance::where('student_id', $student->id)->where('date', '>=', $monthAgo)->get();
            if ($recentAttendance->isNotEmpty()) {
                $absenceRate = $recentAttendance->where('status', 'absent')->count() / $recentAttendance->count();
                if ($absenceRate > 0.2) {
                    $reasons[] = 'نسبة غياب أعلى من 20% خلال آخر 30 يوماً ('.round($absenceRate * 100).'%)';
                }
            }

            $unsubmitted = Assignment::where('school_id', $schoolId)
                ->where('section_id', $student->section_id)
                ->where('due_date', '<', now())
                ->whereDoesntHave('submissions', fn ($q) => $q->where('student_id', $student->id))
                ->count();
            if ($unsubmitted >= 2) {
                $reasons[] = "لم يُسلَّم {$unsubmitted} واجبات متأخرة";
            }

            if (!empty($reasons)) {
                $flags[] = [
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'reasons' => $reasons,
                ];
            }
        }

        return $flags;
    }

    private function buildStudentContext(Student $student): string
    {
        $year = AcademicYear::where('school_id', $student->school_id)->where('is_current', true)->with('terms.months')->first();

        $lines = ["الاسم: {$student->full_name}"];

        if ($year) {
            $subjects = Subject::where('school_id', $student->school_id)->get();
            foreach ($subjects as $subject) {
                $avg = (new GradeCalculator($student->id, $subject->id, $year))->finalAverage();
                if ($avg !== null) {
                    $lines[] = "- معدل مادة {$subject->name_ar}: {$avg}";
                }
            }
        }

        $monthAgo = Carbon::now()->subDays(30);
        $attendance = Attendance::where('student_id', $student->id)->where('date', '>=', $monthAgo)->get();
        if ($attendance->isNotEmpty()) {
            $absentDays = $attendance->where('status', 'absent')->count();
            $lines[] = "- أيام الغياب خلال آخر 30 يوماً: {$absentDays} من أصل {$attendance->count()}";
        }

        $submissions = AssignmentSubmission::where('student_id', $student->id)->whereNotNull('score')->latest()->take(5)->get();
        foreach ($submissions as $submission) {
            $submission->loadMissing('assignment');
            $lines[] = "- درجة واجب \"{$submission->assignment?->title}\": {$submission->score}";
        }

        return implode("\n", $lines);
    }
}
