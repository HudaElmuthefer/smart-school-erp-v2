<?php

namespace App\Http\Controllers\Api;

use App\Exports\StudentsExport;
use App\Exports\TransactionsExport;
use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    use ScopesToSchool;

    public function students(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return Excel::download(new StudentsExport($schoolId), 'students.xlsx');
    }

    public function transactions(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return Excel::download(new TransactionsExport($schoolId), 'transactions.xlsx');
    }
}
