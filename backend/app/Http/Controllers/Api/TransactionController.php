<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = Transaction::where('school_id', $schoolId)->with('account');

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->integer('account_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return response()->json(['transactions' => $query->orderByDesc('transaction_date')->orderByDesc('id')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'type' => ['required', 'in:income,expense'],
            'category' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
            'transaction_date' => ['required', 'date'],
        ]);

        $account = Account::findOrFail($data['account_id']);
        $this->assertBelongsToUserSchool($request, $account->school_id);

        $data['school_id'] = $schoolId;
        $data['created_by'] = $request->user()->id;

        $transaction = Transaction::create($data);

        return response()->json(['transaction' => $transaction->load('account')], 201);
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        $this->assertBelongsToUserSchool($request, $transaction->school_id);
        $transaction->delete();

        return response()->json(['message' => 'تم حذف الحركة المالية']);
    }
}
