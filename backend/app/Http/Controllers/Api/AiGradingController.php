<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Services\AiAgentService;
use Illuminate\Http\Request;

class AiGradingController extends Controller
{
    public function __invoke(Request $request, AssignmentSubmission $submission, AiAgentService $aiAgent)
    {
        $user = $request->user();
        abort_if(!$user->isSuperAdmin() && $user->school_id !== $submission->school_id, 403, 'غير مصرح بالوصول لهذا الفرع');

        $suggestion = $aiAgent->suggestGrading($submission);

        return response()->json($suggestion);
    }
}
