<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'grade_level_id', 'name_ar', 'name_en'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
