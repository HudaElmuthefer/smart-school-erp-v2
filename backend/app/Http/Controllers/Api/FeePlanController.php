<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\FeePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeePlanController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = FeePlan::where('school_id', $schoolId)->with('student');

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        return response()->json(['fee_plans' => $query->orderByDesc('created_at')->get()]);
    }

    public function show(Request $request, FeePlan $feePlan)
    {
        $this->assertBelongsToUserSchool($request, $feePlan->school_id);

        return response()->json(['fee_plan' => $feePlan->load(['student', 'installments.payments'])]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'academic_year_label' => ['required', 'string', 'max:255'],
            'total_amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
            'installments' => ['required', 'array', 'min:1'],
            'installments.*.due_date' => ['required', 'date'],
            'installments.*.amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $feePlan = DB::transaction(function () use ($data, $schoolId) {
            $feePlan = FeePlan::create([
                'school_id' => $schoolId,
                'student_id' => $data['student_id'],
                'academic_year_label' => $data['academic_year_label'],
                'total_amount' => $data['total_amount'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['installments'] as $i => $installment) {
                $feePlan->installments()->create([
                    'installment_number' => $i + 1,
                    'due_date' => $installment['due_date'],
                    'amount' => $installment['amount'],
                ]);
            }

            return $feePlan;
        });

        return response()->json(['fee_plan' => $feePlan->load(['student', 'installments'])], 201);
    }

    public function destroy(Request $request, FeePlan $feePlan)
    {
        $this->assertBelongsToUserSchool($request, $feePlan->school_id);
        $feePlan->delete();

        return response()->json(['message' => 'تم حذف خطة الأقساط']);
    }
}
