<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiClient
{
    public function generate(string $prompt): string
    {
        $key = config('services.gemini.key');
        $model = config('services.gemini.model');

        if (empty($key)) {
            throw new RuntimeException('لم يتم إعداد مفتاح Gemini API (GEMINI_API_KEY)');
        }

        $response = Http::timeout(30)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('فشل الاتصال بخدمة الذكاء الاصطناعي: '.$response->body());
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if ($text === null) {
            throw new RuntimeException('لم يُرجع النموذج أي نص. الاستجابة: '.$response->body());
        }

        return trim($text);
    }
}
