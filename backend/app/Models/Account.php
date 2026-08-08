<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'name', 'opening_balance'];
    protected $appends = ['balance'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /** الرصيد الحالي دائماً محسوب من الحركات، وليس مخزَّناً */
    protected function balance(): Attribute
    {
        return Attribute::get(function () {
            $income = $this->transactions()->where('type', 'income')->sum('amount');
            $expense = $this->transactions()->where('type', 'expense')->sum('amount');

            return round((float) $this->opening_balance + (float) $income - (float) $expense, 2);
        });
    }
}
