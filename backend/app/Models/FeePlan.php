<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeePlan extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'student_id', 'academic_year_label', 'total_amount', 'notes'];
    protected $appends = ['paid_amount', 'remaining'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }

    /** المبلغ المدفوع دائماً محسوب من دفعات الأقساط، وليس مخزَّناً */
    protected function paidAmount(): Attribute
    {
        return Attribute::get(fn () => round((float) InstallmentPayment::whereIn(
            'installment_id',
            $this->installments()->pluck('id')
        )->sum('amount'), 2));
    }

    /** الرصيد المتبقي دائماً محسوب، وليس مخزَّناً */
    protected function remaining(): Attribute
    {
        return Attribute::get(fn () => round((float) $this->total_amount - $this->paid_amount, 2));
    }
}
