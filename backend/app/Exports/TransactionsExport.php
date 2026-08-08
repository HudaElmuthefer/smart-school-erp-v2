<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(protected int $schoolId)
    {
    }

    public function collection()
    {
        return Transaction::where('school_id', $this->schoolId)->with('account')->orderByDesc('transaction_date')->get();
    }

    public function headings(): array
    {
        return ['التاريخ', 'الحساب', 'النوع', 'التصنيف', 'المبلغ', 'الوصف'];
    }

    public function map($transaction): array
    {
        return [
            $transaction->transaction_date->format('Y-m-d'),
            $transaction->account?->name,
            $transaction->type === 'income' ? 'دخل' : 'مصروف',
            $transaction->category,
            $transaction->amount,
            $transaction->description,
        ];
    }
}
