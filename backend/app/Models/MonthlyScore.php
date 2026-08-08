<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyScore extends Model
{
    protected $fillable = [
        'school_id', 'student_id', 'subject_id', 'academic_month_id',
        'daily_exam_score', 'monthly_exam_score', 'daily_preparation_score', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'daily_exam_score' => 'decimal:2',
            'monthly_exam_score' => 'decimal:2',
            'daily_preparation_score' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function month(): BelongsTo
    {
        return $this->belongsTo(AcademicMonth::class, 'academic_month_id');
    }

    /**
     * معدل الشهر = متوسط(اختبار يومي، اختبار شهري) + درجة التحضير اليومي
     * محسوبة ديناميكياً دائماً، لا تُخزَّن كعمود أبداً.
     */
    protected function monthAverage(): Attribute
    {
        return Attribute::get(function () {
            $exams = array_filter(
                [$this->daily_exam_score, $this->monthly_exam_score],
                fn ($v) => $v !== null,
            );

            if (empty($exams) && $this->daily_preparation_score === null) {
                return null;
            }

            $examAverage = count($exams) ? array_sum($exams) / count($exams) : 0;

            return round($examAverage + (float) ($this->daily_preparation_score ?? 0), 2);
        });
    }
}
