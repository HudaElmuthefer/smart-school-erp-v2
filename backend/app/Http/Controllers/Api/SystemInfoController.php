<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Process;

class SystemInfoController extends Controller
{
    public function __invoke()
    {
        $gitSha = trim(Process::path(base_path('..'))->run('git rev-parse --short HEAD')->output());

        return response()->json([
            'app_version' => $gitSha !== '' ? $gitSha : null,
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
        ]);
    }
}
