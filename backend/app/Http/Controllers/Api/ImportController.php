<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    use ScopesToSchool;

    public function students(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new StudentsImport($schoolId);
        Excel::import($import, $request->file('file'));

        return response()->json(['created' => $import->created, 'errors' => $import->errors]);
    }
}
