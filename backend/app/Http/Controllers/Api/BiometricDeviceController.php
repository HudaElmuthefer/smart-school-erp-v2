<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\BiometricDevice;
use Illuminate\Http\Request;

/** يدير قائمة السماح (fail-closed) لأجهزة ZKTeco */
class BiometricDeviceController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json(['devices' => BiometricDevice::where('school_id', $schoolId)->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'serial_number' => ['required', 'string', 'max:255', 'unique:biometric_devices,serial_number'],
            'name' => ['required', 'string', 'max:255'],
        ]);
        $data['school_id'] = $schoolId;
        $data['is_active'] = true;

        return response()->json(['device' => BiometricDevice::create($data)], 201);
    }

    public function update(Request $request, BiometricDevice $device)
    {
        $this->assertBelongsToUserSchool($request, $device->school_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $device->update($data);

        return response()->json(['device' => $device]);
    }

    public function destroy(Request $request, BiometricDevice $device)
    {
        $this->assertBelongsToUserSchool($request, $device->school_id);
        $device->delete();

        return response()->json(['message' => 'تم حذف الجهاز من قائمة السماح']);
    }
}
