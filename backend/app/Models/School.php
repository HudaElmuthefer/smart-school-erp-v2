<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class School extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name_ar', 'name_en', 'app_name_ar', 'app_name_en', 'logo_path',
        'primary_color', 'primary_color_dark', 'school_type', 'passing_grade',
        'phone', 'address', 'email', 'is_active', 'extra_settings',
        'login_tagline_ar', 'login_tagline_en', 'dashboard_quote_ar', 'dashboard_quote_en',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'extra_settings' => 'array',
            'passing_grade' => 'decimal:2',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
