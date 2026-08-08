<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Strict multi-branch data isolation: a branch user is always locked to
 * their own school_id. Only super_admin (general manager) may act across
 * branches, and must do so explicitly via ?school_id=.
 */
trait ScopesToSchool
{
    protected function effectiveSchoolId(Request $request): ?int
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return $request->integer('school_id') ?: null;
        }

        return $user->school_id;
    }

    protected function requireSchoolId(Request $request): int
    {
        $schoolId = $this->effectiveSchoolId($request);
        abort_if($schoolId === null, 422, 'يجب تحديد الفرع (school_id)');

        return $schoolId;
    }

    protected function assertBelongsToUserSchool(Request $request, int $recordSchoolId): void
    {
        $user = $request->user();
        abort_if(!$user->isSuperAdmin() && $user->school_id !== $recordSchoolId, 403, 'غير مصرح بالوصول لهذا الفرع');
    }
}
