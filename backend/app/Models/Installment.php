<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Installment extends Model
{
    protected $fillable = ['fee_plan_id', 'installment_number', 'due_date', 'amount'];
    protected $appends = ['paid_amount', 'remaining'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    public function feePlan(): BelongsTo
    {
        return $this->belongsTo(FeePlan::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InstallmentPayment::class);
    }

    protected function paidAmount(): Attribute
    {
        return Attribute::get(fn () => round((float) $this->payments()->sum('amount'), 2));
    }

    protected function remaining(): Attribute
    {
        return Attribute::get(fn () => round((float) $this->amount - $this->paid_amount, 2));
    }
}
