<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BiometricDevice;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * ZKTeco ADMS (بروتوكول push). fail-closed: أي جهاز رقمه التسلسلي غير
 * موجود كسجل نشط بـbiometric_devices يُرفض تماماً — قائمة فارغة تعني
 * رفض الجميع، أبداً لا تعني "اسمح للكل".
 */
class ZkAdmsController extends Controller
{
    protected function authorizeDevice(Request $request): ?BiometricDevice
    {
        $sn = $request->query('SN');
        if (!$sn) {
            return null;
        }

        $device = BiometricDevice::where('serial_number', $sn)->where('is_active', true)->first();

        if (!$device) {
            Log::warning('ZKTeco ADMS: rejected unrecognized/inactive device', ['serial_number' => $sn]);

            return null;
        }

        $device->update(['last_seen_at' => now()]);

        return $device;
    }

    /** GET /iclock/cdata — طلب مصافحة/إعدادات الجهاز */
    public function handshake(Request $request)
    {
        $device = $this->authorizeDevice($request);
        if (!$device) {
            return response('', Response::HTTP_FORBIDDEN);
        }

        return response(
            "GET OPTION FROM: {$device->serial_number}\r\nATTLOGStamp=0\r\nOPERLOGStamp=0\r\nErrorDelay=60\r\nDelay=30\r\nTransFlag=1111000000\r\nRealtime=1\r\nEncrypt=0\r\n",
            Response::HTTP_OK,
        )->header('Content-Type', 'text/plain');
    }

    /** POST /iclock/cdata?table=ATTLOG — إرسال سجلات الحضور */
    public function push(Request $request)
    {
        $device = $this->authorizeDevice($request);
        if (!$device) {
            return response('', Response::HTTP_FORBIDDEN);
        }

        $table = $request->query('table');
        if ($table !== 'ATTLOG') {
            return response('OK', Response::HTTP_OK)->header('Content-Type', 'text/plain');
        }

        $body = $request->getContent();
        $count = 0;

        foreach (preg_split('/\r\n|\r|\n/', trim($body)) as $line) {
            if (!$line) {
                continue;
            }

            $fields = preg_split('/\t/', $line);
            [$pin, $dateTime] = [$fields[0] ?? null, $fields[1] ?? null];

            if (!$pin || !$dateTime) {
                continue;
            }

            $student = Student::where('school_id', $device->school_id)
                ->where('device_user_id', $pin)
                ->first();

            if (!$student) {
                Log::info('ZKTeco ADMS: attendance for unknown device_user_id', ['pin' => $pin, 'device' => $device->serial_number]);
                continue;
            }

            $timestamp = Carbon::parse($dateTime);
            $date = $timestamp->toDateString();

            $attendance = Attendance::firstOrNew([
                'student_id' => $student->id,
                'date' => $date,
            ]);

            if (!$attendance->exists || !$attendance->check_in_at || $timestamp->lt($attendance->check_in_at)) {
                $attendance->check_in_at = $timestamp;
            }
            if (!$attendance->check_out_at || $timestamp->gt($attendance->check_out_at)) {
                $attendance->check_out_at = $timestamp;
            }

            $attendance->school_id = $device->school_id;
            $attendance->status = 'present';
            $attendance->source = 'device';
            $attendance->save();

            $count++;
        }

        return response((string) $count, Response::HTTP_OK)->header('Content-Type', 'text/plain');
    }

    /** GET /iclock/getrequest — الجهاز يستعلم عن أوامر معلّقة */
    public function getRequest(Request $request)
    {
        $device = $this->authorizeDevice($request);
        if (!$device) {
            return response('', Response::HTTP_FORBIDDEN);
        }

        return response('OK', Response::HTTP_OK)->header('Content-Type', 'text/plain');
    }

    /** POST /iclock/devicecmd — الجهاز يبلّغ نتيجة تنفيذ الأوامر */
    public function deviceCmd(Request $request)
    {
        $device = $this->authorizeDevice($request);
        if (!$device) {
            return response('', Response::HTTP_FORBIDDEN);
        }

        return response('OK', Response::HTTP_OK)->header('Content-Type', 'text/plain');
    }
}
