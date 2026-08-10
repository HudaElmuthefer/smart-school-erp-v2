<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Spatie\Backup\BackupDestination\BackupDestinationFactory;
use Spatie\Backup\Config\Config;
use Symfony\Component\Process\Process;
use ZipArchive;

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
                    ...$this->inspectBackupContents($destination->diskName(), $backup->path()),
                ]);
            }
        }

        return response()->json(['backups' => $backups->sortByDesc('date')->values()]);
    }

    public function store(Request $request)
    {
        $this->assertCanManageBackups($request);

        // النوع: db (قاعدة بيانات فقط، الافتراضي) أو full (قاعدة بيانات + كود الخادم)
        $type = $request->validate(['type' => ['sometimes', 'in:db,full']])['type'] ?? 'db';
        $options = $type === 'db' ? ['--only-db' => true] : [];

        $exitCode = Artisan::call('backup:run', $options);

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

    /**
     * استرجاع قاعدة البيانات بالكامل من نسخة احتياطية سابقة: يُفرّغ مخطط public
     * الحالي (DROP/CREATE) ثم يُنفَّذ ملف تفريغ pg_dump المحفوظ داخل النسخة —
     * استرجاع حقيقي عبر psql، وليس شكلياً.
     */
    public function restoreDatabase(Request $request)
    {
        $this->assertCanManageBackups($request);
        $data = $request->validate(['disk' => ['required', 'string'], 'path' => ['required', 'string']]);

        [$zip, $zipLocalPath] = $this->openBackupZip($data['disk'], $data['path']);

        $dumpEntry = null;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (str_contains(str_replace('\\', '/', $name), 'db-dumps/') && str_ends_with($name, '.sql')) {
                $dumpEntry = $name;
                break;
            }
        }
        abort_if(!$dumpEntry, 422, 'هذه النسخة لا تحتوي على نسخة لقاعدة البيانات');

        $workDir = storage_path('app/tmp-restore-'.uniqid());
        File::ensureDirectoryExists($workDir);
        $resetFile = $workDir.'/__reset.sql';
        $dumpFile = $workDir.'/__dump.sql';
        file_put_contents($resetFile, 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
        file_put_contents($dumpFile, $zip->getFromName($dumpEntry));
        $zip->close();
        @unlink($zipLocalPath);

        $this->runPsql($resetFile);
        $this->runPsql($dumpFile);

        File::deleteDirectory($workDir);

        return response()->json(['message' => 'تم استرجاع قاعدة البيانات بنجاح']);
    }

    /**
     * استرجاع ملفات كود الخادم (Laravel) من نسخة احتياطية سابقة — يستثني دائماً
     * .env حتى لا يُستبدَل اتصال قاعدة البيانات/مفتاح التطبيق الحي بقيم قديمة،
     * ويستثني ملفات db-dumps (تلك ليست كوداً).
     */
    public function restoreFiles(Request $request)
    {
        $this->assertCanManageBackups($request);
        $data = $request->validate(['disk' => ['required', 'string'], 'path' => ['required', 'string']]);

        [$zip, $zipLocalPath] = $this->openBackupZip($data['disk'], $data['path']);

        $base = rtrim(str_replace('\\', '/', base_path()), '/');
        $restored = 0;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $rawName = $zip->getNameIndex($i);
            $isDirEntry = str_ends_with($rawName, '/') || str_ends_with($rawName, '\\');
            if ($isDirEntry) {
                continue;
            }

            $normalized = str_replace('\\', '/', $rawName);
            if (str_contains($normalized, 'db-dumps/')) {
                continue;
            }
            if (strcasecmp(substr($normalized, 0, strlen($base)), $base) !== 0) {
                continue; // خارج جذر الخادم المتوقَّع — يُتجاهَل احترازاً
            }

            $relative = ltrim(substr($normalized, strlen($base)), '/');
            if ($relative === '' || $relative === '.env' || str_starts_with($relative, '.env.')) {
                continue;
            }

            $destination = $base.'/'.$relative;
            File::ensureDirectoryExists(dirname($destination));
            file_put_contents($destination, $zip->getFromIndex($i));
            $restored++;
        }

        $zip->close();
        @unlink($zipLocalPath);

        return response()->json(['message' => "تم استرجاع كود الخادم ({$restored} ملف)"]);
    }

    /** يفحص محتويات النسخة ليحدد الواجهة الأمامية أي أزرار استرجاع تعرضها (قاعدة بيانات/كود) */
    protected function inspectBackupContents(string $disk, string $path): array
    {
        $hasDb = false;
        $hasFiles = false;
        $absolutePath = Storage::disk($disk)->path($path);

        if (is_file($absolutePath)) {
            $zip = new ZipArchive;
            if ($zip->open($absolutePath) === true) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = str_replace('\\', '/', $zip->getNameIndex($i));
                    if (str_contains($name, 'db-dumps/')) {
                        $hasDb = true;
                    } elseif (!str_ends_with($name, '/')) {
                        $hasFiles = true;
                    }
                }
                $zip->close();
            }
        }

        return ['has_db' => $hasDb, 'has_files' => $hasFiles];
    }

    /** @return array{0: ZipArchive, 1: string} */
    protected function openBackupZip(string $disk, string $path): array
    {
        $localPath = tempnam(sys_get_temp_dir(), 'backup_').'.zip';
        file_put_contents($localPath, Storage::disk($disk)->get($path));

        $zip = new ZipArchive;
        $opened = $zip->open($localPath);
        abort_if($opened !== true, 500, 'تعذّر فتح ملف النسخة الاحتياطية');

        return [$zip, $localPath];
    }

    /** تشغيل psql بنفس إصلاح متغيرات بيئة ويندوز المستخدم مع pg_dump (راجع WindowsPostgreSqlDumper) */
    protected function runPsql(string $sqlFilePath): void
    {
        $conn = config('database.connections.pgsql');
        $binDir = rtrim($conn['dump']['dump_binary_path'] ?? '', '/');
        $psqlBin = $binDir !== '' ? $binDir.'/psql' : 'psql';
        if (PHP_OS_FAMILY === 'Windows' && !str_ends_with($psqlBin, '.exe')) {
            $psqlBin .= '.exe';
        }

        $env = array_merge(getenv(), [
            'PGPASSWORD' => (string) $conn['password'],
            'PGHOST' => (string) $conn['host'],
            'PGPORT' => (string) $conn['port'],
            'PGUSER' => (string) $conn['username'],
            'PGDATABASE' => (string) $conn['database'],
        ]);

        $process = new Process([$psqlBin, '-v', 'ON_ERROR_STOP=1', '-f', $sqlFilePath], null, $env, null, 300);
        $process->run();

        abort_if(!$process->isSuccessful(), 500, 'فشل تنفيذ الاستعادة: '.$process->getErrorOutput());
    }
}
