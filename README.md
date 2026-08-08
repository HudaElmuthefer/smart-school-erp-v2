# School ERP + LMS

نظام إدارة مدرسية متكامل: Laravel 13 (PHP 8.3) + PostgreSQL + React 19/TypeScript/Vite.

## متطلبات التشغيل المحلي

- **PHP 8.3 مستقل** بـ`C:\php83\php.exe` — **لا تستخدم PHP الخاصة بـXAMPP** (قديمة جداً لـLaravel 13).
- PostgreSQL 18 (خدمة ويندوز) — قاعدة بيانات `school_erp`.
- Node.js + npm.

## الإعداد

```bash
# الباك اند
cd backend
cp .env.example .env   # عدّل DB_PASSWORD
C:\php83\php.exe artisan key:generate
C:\php83\php.exe artisan migrate --seed
C:\php83\php.exe artisan serve

# الفرونت اند
cd frontend
cp .env.example .env
npm install
npm run dev
```

## حسابات تجريبية (بعد seed)

| الدور | البريد | كلمة المرور |
|---|---|---|
| مدير عام (كل الفروع) | superadmin@school.local | Admin@123 |
| مدير فرع | admin@school.local | Admin@123 |
| معلم | teacher@school.local | Admin@123 |
| موظف | staff@school.local | Admin@123 |

## البنية

تعدد الفروع مُطبّق من الأساس (`schools` + `users.school_id` + `ScopesToSchool`). لا يوجد تسجيل دخول للطالب — ولي الأمر يتصرف نيابة عن ابنه.
