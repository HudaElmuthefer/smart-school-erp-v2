<?php

use App\Http\Controllers\Api\ZkAdmsController;
use Illuminate\Support\Facades\Route;

// خارج بادئة /api عمداً: أجهزة ZKTeco لا يمكن إعادة برمجتها لاستخدام مسار مخصص،
// ولا تدعم مصادقة Sanctum — الحماية عبر قائمة السماح (BiometricDevice) فقط.
Route::get('/iclock/cdata', [ZkAdmsController::class, 'handshake']);
Route::post('/iclock/cdata', [ZkAdmsController::class, 'push']);
Route::get('/iclock/getrequest', [ZkAdmsController::class, 'getRequest']);
Route::post('/iclock/devicecmd', [ZkAdmsController::class, 'deviceCmd']);
