<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Spatie\Backup\BackupDestination\BackupDestinationFactory;
use Spatie\Backup\Config\Config;

class BackupController extends Controller
{
    /** النسخ الاحتياطي عملية حسّاسة على مستوى النظام كله، وليست خاصة بفرع؛ تُقصر على المدير العام/مدير الفرع فقط */
    protected function assertCanManageBackups(Request $request): void
    {
        $role = $request->user()->role?->name;
        abort_if(!in_array($role, ['super_admin', 'admin'], true), 403, 'هذا الإجراء متاح للمدير فقط');
    }

    public function index(Request $request)
    {
        $this->assertCanManageBackups($request);

        $backups = collect();
        $config = Config::fromArray(config('backup'));
        foreach (BackupDestinationFactory::createFromArray($config) as $destination) {
            foreach ($destination->backups() as $backup) {
                $backups->push([
                    'disk' => $destination->diskName(),
                    'path' => $backup->path(),
                    'size' => $backup->sizeInBytes(),
                    'date' => $backup->date()->toDateTimeString(),
                ]);
            }
        }

        return response()->json(['backups' => $backups->sortByDesc('date')->values()]);
    }

    public function store(Request $request)
    {
        $this->assertCanManageBackups($request);

        $exitCode = Artisan::call('backup:run', ['--only-db' => true]);

        abort_if($exitCode !== 0, 500, 'فشل إنشاء النسخة الاحتياطية: '.Artisan::output());

        return response()->json(['message' => 'تم إنشاء نسخة احتياطية جديدة بنجاح']);
    }

    public function download(Request $request)
    {
        $this->assertCanManageBackups($request);

        $data = $request->validate(['disk' => ['required', 'string'], 'path' => ['required', 'string']]);

        return Storage::disk($data['disk'])->download($data['path']);
    }

    public function destroy(Request $request)
    {
        $this->assertCanManageBackups($request);

        $data = $request->validate(['disk' => ['required', 'string'], 'path' => ['required', 'string']]);

        Storage::disk($data['disk'])->delete($data['path']);

        return response()->json(['message' => 'تم حذف النسخة الاحتياطية']);
    }
}
