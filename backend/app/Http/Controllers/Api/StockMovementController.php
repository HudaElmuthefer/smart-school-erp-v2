<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToSchool;
use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    use ScopesToSchool;

    public function index(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);
        $query = StockMovement::where('school_id', $schoolId)->with('item');

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->integer('item_id'));
        }

        return response()->json(['stock_movements' => $query->orderByDesc('movement_date')->orderByDesc('id')->get()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchoolId($request);

        $data = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'type' => ['required', 'in:in,out'],
            'quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
            'movement_date' => ['required', 'date'],
        ]);

        $item = Item::findOrFail($data['item_id']);
        $this->assertBelongsToUserSchool($request, $item->school_id);

        if ($data['type'] === 'out') {
            abort_if($data['quantity'] > $item->quantity_on_hand, 422, 'الكمية المطلوب صرفها أكبر من الكمية المتوفرة');
        }

        $data['school_id'] = $schoolId;
        $data['created_by'] = $request->user()->id;

        $movement = StockMovement::create($data);

        return response()->json(['stock_movement' => $movement->load('item')], 201);
    }

    public function destroy(Request $request, StockMovement $stockMovement)
    {
        $this->assertBelongsToUserSchool($request, $stockMovement->school_id);
        $stockMovement->delete();

        return response()->json(['message' => 'تم حذف الحركة']);
    }
}
