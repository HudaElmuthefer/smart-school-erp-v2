<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Services\AiAgentService;
use Illuminate\Http\Request;

class AiEarlyWarningController extends Controller
{
    use ScopesToSchool;

    public function __invoke(Request $request, AiAgentService $aiAgent)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json(['flags' => $aiAgent->earlyWarningScan($schoolId)]);
    }
}
