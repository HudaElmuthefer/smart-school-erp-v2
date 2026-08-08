<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicTerm extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'academic_year_id', 'type', 'order'];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function months(): HasMany
    {
        return $this->hasMany(AcademicMonth::class)->orderBy('month_number');
    }

    /** الفصلان العاديان (أول/ثاني) يُبنيان من أشهر؛ نصف السنة/النهائي درجة واحدة تُدخَل مباشرة */
    public function hasMonths(): bool
    {
        return in_array($this->type, ['first_term', 'second_term'], true);
    }
}
