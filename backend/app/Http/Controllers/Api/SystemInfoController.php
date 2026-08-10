<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class SystemInfoController extends Controller
{
    public function __invoke()
    {
        // ملف VERSION بجذر المشروع (يُحدَّث يدوياً عند كل إصدار) — بديل موثوق عن
        // "git rev-parse" الذي كان يعمل فقط عبر CLI/tinker ويعيد قيمة فارغة عند
        // تشغيله من عملية خادم HTTP (اختلاف بيئة/PATH بين العمليتين).
        $versionFile = base_path('../VERSION');
        $version = is_file($versionFile) ? trim(file_get_contents($versionFile)) : null;

        return response()->json([
            'app_version' => $version ?: null,
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
        ]);
    }
}
