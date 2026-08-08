<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'title_ar', 'title_en', 'body_ar', 'body_en', 'event_date', 'target_roles', 'created_by'];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'target_roles' => 'array',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
