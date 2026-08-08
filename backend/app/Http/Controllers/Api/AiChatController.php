<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiAgentService;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    public function __invoke(Request $request, AiAgentService $aiAgent)
    {
        $user = $request->user();
        abort_if($user->role?->name !== 'parent', 403, 'هذا الإجراء متاح لحساب ولي الأمر فقط');

        $data = $request->validate(['message' => ['required', 'string', 'max:1000']]);

        $reply = $aiAgent->parentChat($user, $data['message']);

        return response()->json(['reply' => $reply]);
    }
}
