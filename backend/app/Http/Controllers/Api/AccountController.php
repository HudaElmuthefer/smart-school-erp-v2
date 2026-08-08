<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json(['accounts' => Account::where('school_id', $schoolId)->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'opening_balance' => ['nullable', 'numeric'],
        ]);
        $data['school_id'] = $schoolId;

        $account = Account::create($data);

        return response()->json(['account' => $account], 201);
    }

    public function update(Request $request, Account $account)
    {
        $this->assertBelongsToUserSchool($request, $account->school_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
        ]);
        $account->update($data);

        return response()->json(['account' => $account->fresh()]);
    }

    public function destroy(Request $request, Account $account)
    {
        $this->assertBelongsToUserSchool($request, $account->school_id);
        $account->delete();

        return response()->json(['message' => 'تم حذف الحساب']);
    }
}
