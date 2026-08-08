<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** درجة مُدخَلة مباشرة للفصول الامتحانية فقط (نصف السنة، النهائي) — بلا تفصيل شهري */
class TermScore extends Model
{
    protected $fillable = ['school_id', 'student_id', 'subject_id', 'academic_term_id', 'score', 'created_by'];

    protected function casts(): array
    {
        return ['score' => 'decimal:2'];
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'academic_term_id');
    }
}
