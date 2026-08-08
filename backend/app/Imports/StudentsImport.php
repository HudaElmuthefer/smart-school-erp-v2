<?php

namespace App\Imports;

use App\Models\Section;
use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

/**
 * أعمدة الملف بالترتيب: الاسم الكامل، الرقم الوطني (اختياري)، اسم الشعبة، تاريخ الميلاد (اختياري).
 * يُطابق اسم الشعبة داخل نفس الفرع فقط.
 */
class StudentsImport implements ToCollection, WithStartRow
{
    public int $created = 0;
    public array $errors = [];

    public function __construct(protected int $schoolId)
    {
    }

    public function startRow(): int
    {
        return 2;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $fullName = trim((string) ($row[0] ?? ''));
            $sectionName = trim((string) ($row[2] ?? ''));

            if ($fullName === '' || $sectionName === '') {
                $this->errors[] = "السطر {$rowNumber}: الاسم أو اسم الشعبة مفقود";
                continue;
            }

            $section = Section::where('school_id', $this->schoolId)->where('name_ar', $sectionName)->first();
            if (!$section) {
                $this->errors[] = "السطر {$rowNumber}: لا توجد شعبة باسم \"{$sectionName}\"";
                continue;
            }

            Student::create([
                'school_id' => $this->schoolId,
                'full_name' => $fullName,
                'national_id' => trim((string) ($row[1] ?? '')) ?: null,
                'section_id' => $section->id,
                'date_of_birth' => trim((string) ($row[3] ?? '')) ?: null,
            ]);
            $this->created++;
        }
    }
}
