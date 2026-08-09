<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSectionAccess extends Model
{
    protected $table = 'user_section_access';
    protected $fillable = ['user_id', 'section_key'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
