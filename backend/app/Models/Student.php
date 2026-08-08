<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'school_id', 'full_name', 'national_id', 'section_id',
        'date_of_birth', 'photo_path', 'device_user_id',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** حساب ولي الأمر الذي يتصرف نيابة عن هذا الطالب (لا يوجد تسجيل دخول للطالب نفسه) */
    public function guardianAccount(): HasOne
    {
        return $this->hasOne(User::class, 'student_id');
    }
}
