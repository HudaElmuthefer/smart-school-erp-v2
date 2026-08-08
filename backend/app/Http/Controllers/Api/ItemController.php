<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        return response()->json(['items' => Item::where('school_id', $schoolId)->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:255'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ]);
        $data['school_id'] = $schoolId;

        $item = Item::create($data);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, Item $item)
    {
        $this->assertBelongsToUserSchool($request, $item->school_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'unit' => ['sometimes', 'string', 'max:255'],
            'reorder_level' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);
        $item->update($data);

        return response()->json(['item' => $item->fresh()]);
    }

    public function destroy(Request $request, Item $item)
    {
        $this->assertBelongsToUserSchool($request, $item->school_id);
        $item->delete();

        return response()->json(['message' => 'تم حذف الصنف']);
    }
}
