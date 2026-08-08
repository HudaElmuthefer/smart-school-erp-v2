<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** يمنع حساب ولي الأمر من الوصول لواجهات الطاقم الإداري/التدريسي (لا يوجد تسجيل دخول للطالب، وولي الأمر مقصور على واجهاته الخاصة فقط) */
class EnsureStaffRole
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->user()?->role?->name === 'parent', 403, 'هذا الإجراء غير متاح لحساب ولي الأمر');

        return $next($request);
    }
}
