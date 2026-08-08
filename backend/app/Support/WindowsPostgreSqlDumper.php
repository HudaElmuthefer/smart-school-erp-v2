<?php

namespace App\Support;

use Spatie\DbDumper\Databases\PostgreSql;
use Spatie\DbDumper\Exceptions\CannotStartDump;
use Symfony\Component\Process\Process;

/**
 * إصلاح خطأ ويندوز المعروف مع pg_dump: "could not generate restrict key".
 * السبب: Symfony Process يستبدل بيئة العملية بالكامل بمصفوفة env المخصصة
 * (بيانات اعتماد postgres فقط)، فتُفقد متغيرات ويندوز الأساسية (مثل SystemRoot)
 * التي تحتاجها واجهة تشفير ويندوز داخل pg_dump. الحل: دمج getenv() الحالية
 * مع متغيرات بيانات الاعتماد بدل استبدالها بالكامل.
 */
class WindowsPostgreSqlDumper extends PostgreSql
{
    public function getProcess(string $dumpFile): Process
    {
        $command = $this->getDumpCommand($dumpFile);

        $tempFileHandle = $this->getTempFileHandle();

        if (! is_resource($tempFileHandle)) {
            throw CannotStartDump::emptyParameter('tempFileHandle');
        }

        fwrite($tempFileHandle, $this->getContentsOfCredentialsFile());
        $temporaryCredentialsFile = stream_get_meta_data($tempFileHandle)['uri'];

        $envVars = array_merge(getenv(), $this->getEnvironmentVariablesForDumpCommand($temporaryCredentialsFile));

        return Process::fromShellCommandline($command, null, $envVars, null, $this->timeout);
    }
}
