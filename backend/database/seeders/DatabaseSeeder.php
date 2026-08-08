<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = collect([
            ['name' => 'super_admin', 'name_ar' => 'مدير عام'],
            ['name' => 'admin', 'name_ar' => 'مدير فرع'],
            ['name' => 'teacher', 'name_ar' => 'معلم'],
            ['name' => 'staff', 'name_ar' => 'موظف'],
            ['name' => 'parent', 'name_ar' => 'ولي أمر'],
            ['name' => 'accountant', 'name_ar' => 'محاسب'],
            ['name' => 'hr', 'name_ar' => 'موارد بشرية'],
        ])->mapWithKeys(fn ($r) => [$r['name'] => Role::firstOrCreate(['name' => $r['name']], $r)->id]);

        $school = School::firstOrCreate(['name_ar' => 'مدرسة البصرة النموذجية'], [
            'name_en' => 'Basra Model School',
            'app_name_ar' => 'نظام المدرسة الذكي',
            'app_name_en' => 'Smart School System',
            'primary_color' => '#0F1A2B',
            'primary_color_dark' => '#C9942A',
            'school_type' => 'private',
            'passing_grade' => 50,
            'login_tagline_ar' => 'نتعلم اليوم لنبني المستقبل',
            'login_tagline_en' => 'Learning today to build tomorrow',
        ]);

        User::firstOrCreate(['email' => 'superadmin@school.local'], [
            'full_name' => 'المدير العام',
            'password' => 'Admin@123',
            'role_id' => $roles['super_admin'],
            'school_id' => null,
            'is_active' => true,
        ]);

        User::firstOrCreate(['email' => 'admin@school.local'], [
            'full_name' => 'مدير المدرسة',
            'password' => 'Admin@123',
            'role_id' => $roles['admin'],
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        User::firstOrCreate(['email' => 'teacher@school.local'], [
            'full_name' => 'حامد علي',
            'password' => 'Admin@123',
            'role_id' => $roles['teacher'],
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        User::firstOrCreate(['email' => 'staff@school.local'], [
            'full_name' => 'موظف الاستقبال',
            'password' => 'Admin@123',
            'role_id' => $roles['staff'],
            'school_id' => $school->id,
            'is_active' => true,
        ]);
    }
}
