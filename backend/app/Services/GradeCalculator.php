<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\MonthlyScore;
use App\Models\TermScore;

/**
 * سلسلة الدرجات الكاملة، بالكامل حساب ديناميكي فوق monthly_scores/term_scores
 * — لا يوجد أي معدل مخزَّن كعمود.
 *
 * معدل الشهر = متوسط(اختبار يومي، اختبار شهري) + درجة التحضير اليومي   (MonthlyScore::monthAverage)
 * معدل الفصل = متوسط(معدل الشهر1، معدل الشهر2، معدل الشهر3)
 * السعي     = متوسط(معدل الفصل الأول، معدل الفصل الثاني، درجة نصف السنة)
 * النهائي   = متوسط(السعي، درجة الامتحان النهائي)
 */
class GradeCalculator
{
    public function __construct(private int $studentId, private int $subjectId, private AcademicYear $year)
    {
    }

    /** متوسط متسامح مع القيم المفقودة — يتجاهلها بدل معاملتها كصفر */
    private function average(array $values): ?float
    {
        $present = array_filter($values, fn ($v) => $v !== null);

        if (empty($present)) {
            return null;
        }

        return round(array_sum($present) / count($present), 2);
    }

    public function termAverage(string $type): ?float
    {
        $term = $this->year->terms->firstWhere('type', $type);
        if (!$term) {
            return null;
        }

        if ($term->hasMonths()) {
            $monthAverages = MonthlyScore::where('student_id', $this->studentId)
                ->where('subject_id', $this->subjectId)
                ->whereIn('academic_month_id', $term->months->pluck('id'))
                ->get()
                ->map(fn (MonthlyScore $m) => $m->month_average)
                ->all();

            return $this->average($monthAverages);
        }

        return TermScore::where('student_id', $this->studentId)
            ->where('subject_id', $this->subjectId)
            ->where('academic_term_id', $term->id)
            ->value('score');
    }

    public function seai(): ?float
    {
        return $this->average([
            $this->termAverage('first_term'),
            $this->termAverage('second_term'),
            $this->termAverage('mid_year'),
        ]);
    }

    public function finalAverage(): ?float
    {
        return $this->average([
            $this->seai(),
            $this->termAverage('final_exam'),
        ]);
    }

    public function breakdown(): array
    {
        return [
            'first_term_average' => $this->termAverage('first_term'),
            'second_term_average' => $this->termAverage('second_term'),
            'mid_year_score' => $this->termAverage('mid_year'),
            'seai' => $this->seai(),
            'final_exam_score' => $this->termAverage('final_exam'),
            'final_average' => $this->finalAverage(),
        ];
    }
}
