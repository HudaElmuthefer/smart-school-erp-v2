<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicYearController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json([
            'academic_years' => AcademicYear::where('school_id', $schoolId)
                ->with('terms.months')
                ->orderByDesc('start_date')
                ->get(),
        ]);
    }

    /** ينشئ سنة دراسية بالبنية القياسية (فصل أول/ثاني بثلاثة أشهر لكل واحد، نصف سنة، نهائي) */
    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ]);

        $year = DB::transaction(function () use ($data, $schoolId) {
            if (!empty($data['is_current'])) {
                AcademicYear::where('school_id', $schoolId)->update(['is_current' => false]);
            }

            $year = AcademicYear::create([...$data, 'school_id' => $schoolId]);

            $terms = [
                ['type' => 'first_term', 'order' => 1, 'months' => 3],
                ['type' => 'second_term', 'order' => 2, 'months' => 3],
                ['type' => 'mid_year', 'order' => 3, 'months' => 0],
                ['type' => 'final_exam', 'order' => 4, 'months' => 0],
            ];

            foreach ($terms as $t) {
                $term = $year->terms()->create([
                    'school_id' => $schoolId,
                    'type' => $t['type'],
                    'order' => $t['order'],
                ]);

                for ($i = 1; $i <= $t['months']; $i++) {
                    $term->months()->create(['school_id' => $schoolId, 'month_number' => $i]);
                }
            }

            return $year;
        });

        return response()->json(['academic_year' => $year->load('terms.months')], 201);
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $this->assertBelongsToUserSchool($request, $academicYear->school_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'is_current' => ['sometimes', 'boolean'],
        ]);

        if (!empty($data['is_current'])) {
            AcademicYear::where('school_id', $academicYear->school_id)->update(['is_current' => false]);
        }
        $academicYear->update($data);

        return response()->json(['academic_year' => $academicYear->fresh('terms.months')]);
    }

    public function destroy(Request $request, AcademicYear $academicYear)
    {
        $this->assertBelongsToUserSchool($request, $academicYear->school_id);
        $academicYear->delete();

        return response()->json(['message' => 'تم الحذف']);
    }
}
