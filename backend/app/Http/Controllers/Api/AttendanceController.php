<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = Attendance::where('school_id', $schoolId)->with('student');

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date('date_to'));
        }
        if ($request->filled('section_id')) {
            $query->whereHas('student', fn ($q) => $q->where('section_id', $request->integer('section_id')));
        }

        return response()->json(['attendances' => $query->orderByDesc('date')->paginate($request->integer('per_page', 30))]);
    }

    /** التسجيل اليدوي لا يستبدل أبداً سجلاً مصدره الجهاز لنفس اليوم إلا إذا وُجد يدوياً مسبقاً */
    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late,excused'],
        ]);

        $attendance = Attendance::updateOrCreate(
            ['student_id' => $data['student_id'], 'date' => $data['date']],
            [
                'school_id' => $schoolId,
                'status' => $data['status'],
                'recorded_by' => $request->user()->id,
                'source' => 'manual',
            ],
        );

        return response()->json(['attendance' => $attendance->load('student')], 201);
    }
}
