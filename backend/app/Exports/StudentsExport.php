<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentsExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(protected int $schoolId)
    {
    }

    public function collection()
    {
        return Student::where('school_id', $this->schoolId)->with('section.gradeLevel')->orderBy('full_name')->get();
    }

    public function headings(): array
    {
        return ['الاسم الكامل', 'الرقم الوطني', 'المرحلة', 'الشعبة', 'تاريخ الميلاد'];
    }

    public function map($student): array
    {
        return [
            $student->full_name,
            $student->national_id,
            $student->section?->gradeLevel?->name_ar,
            $student->section?->name_ar,
            $student->date_of_birth?->format('Y-m-d'),
        ];
    }
}
