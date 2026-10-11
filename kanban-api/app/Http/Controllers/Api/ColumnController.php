<?php

namespace App\Http\Controllers\Api;

use App\Events\BoardUpdated;
use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use Illuminate\Http\Request;

class ColumnController extends Controller
{
    public function store(Request $request, Board $board)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $position = $board->columns()->max('position') + 1;
        $column   = $board->columns()->create([
            'name'     => $data['name'],
            'position' => $position,
        ]);

        // ✅ Broadcast kolom baru
        broadcast(new BoardUpdated(
            boardId: $board->id,
            type:    'column_created',
            payload: ['column' => $column],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json($column, 201);
    }

    public function update(Request $request, Column $column)
    {
        $oldName = $column->name;
        $column->update($request->validate([
            'name' => 'required|string|max:255',
        ]));

        // ✅ Broadcast rename kolom
        broadcast(new BoardUpdated(
            boardId: $column->board_id,
            type:    'column_renamed',
            payload: ['column_id' => $column->id, 'name' => $column->name],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json($column);
    }

    public function destroy(Column $column)
    {
        $boardId = $column->board_id;
        $columnId = $column->id;
        $column->delete();

        // ✅ Broadcast hapus kolom
        broadcast(new BoardUpdated(
            boardId: $boardId,
            type:    'column_deleted',
            payload: ['column_id' => $columnId],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json(null, 204);
    }
}