<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'بيانات غير صالحة', 'errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Auth::getProvider()->validateCredentials($user, ['password' => $request->password])) {
            return response()->json(['message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'هذا الحساب معطّل. تواصل مع إدارة المدرسة.'], 403);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    protected function formatUser(User $user): array
    {
        $user->loadMissing(['role', 'school']);

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role?->name,
            'role_ar' => $user->role?->name_ar,
            'school_id' => $user->school_id,
            'student_id' => $user->student_id,
            'locale' => $user->locale,
            'theme' => $user->theme,
            'avatar_path' => $user->avatar_path,
            'dashboard_prefs' => $user->dashboard_prefs,
            'is_super_admin' => $user->isSuperAdmin(),
        ];
    }
}
