<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'name', 'unit', 'reorder_level'];
    protected $appends = ['quantity_on_hand'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /** الكمية المتوفرة دائماً محسوبة من الحركات، وليست مخزَّنة */
    protected function quantityOnHand(): Attribute
    {
        return Attribute::get(function () {
            $in = $this->movements()->where('type', 'in')->sum('quantity');
            $out = $this->movements()->where('type', 'out')->sum('quantity');

            return (int) $in - (int) $out;
        });
    }
}
