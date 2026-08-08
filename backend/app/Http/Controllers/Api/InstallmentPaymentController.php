<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\InstallmentPayment;
use Illuminate\Http\Request;

class InstallmentPaymentController extends Controller
{
    public function store(Request $request, Installment $installment)
    {
        $user = $request->user();
        $feePlan = $installment->feePlan;
        abort_if(!$user->isSuperAdmin() && $user->school_id !== $feePlan->school_id, 403, 'غير مصرح بالوصول لهذا الفرع');

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['required', 'date'],
        ]);

        abort_if($data['amount'] > $installment->remaining + 0.001, 422, 'المبلغ أكبر من المتبقي على هذا القسط');

        $payment = InstallmentPayment::create([
            'installment_id' => $installment->id,
            'amount' => $data['amount'],
            'paid_at' => $data['paid_at'],
            'received_by' => $user->id,
        ]);

        return response()->json(['payment' => $payment, 'installment' => $installment->fresh()], 201);
    }
}
