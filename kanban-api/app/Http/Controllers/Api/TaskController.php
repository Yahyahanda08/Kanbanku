<?php

namespace App\Http\Controllers\Api;

use App\Events\BoardUpdated;
use App\Http\Controllers\Controller;
use App\Models\Column;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request, Column $column)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'in:low,medium,high',
            'due_date'    => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $data['priority'] = $data['priority'] ?? 'medium';
        $position = $column->tasks()->max('position') + 1;

        $task = $column->tasks()->create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'priority'    => $data['priority'],
            'due_date'    => $data['due_date'] ?? null,
            'assigned_to' => $data['assigned_to'] ?? null,
            'position'    => $position,
        ]);

        $task->load('assignee');

        // ✅ Broadcast card baru
        broadcast(new BoardUpdated(
            boardId: $column->board_id,
            type:    'card_created',
            payload: ['task' => $task],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json($task, 201);
    }

    public function show(Task $task)
    {
        return response()->json($task->load(['assignee', 'comments.user']));
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'priority'     => 'sometimes|in:low,medium,high',
            'due_date'     => 'nullable|date',
            'assigned_to'  => 'nullable|exists:users,id',
            'is_completed' => 'sometimes|boolean',
            'bg_color'     => 'nullable|string',
        ]);

        $task->update($validated);
        $task->load('assignee');

        // ✅ Broadcast update card
        broadcast(new BoardUpdated(
            boardId: $task->column->board_id,
            type:    'card_updated',
            payload: ['task' => $task],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json($task);
    }

    public function move(Request $request, Task $task)
    {
        $request->validate([
            'column_id' => 'required|exists:columns,id',
            'position'  => 'required|integer|min:0',
        ]);

        $targetColumn = Column::findOrFail($request->column_id);
        if ($targetColumn->board_id !== $task->column->board_id) {
            return response()->json(['message' => 'Kolom tidak dalam board yang sama'], 403);
        }

        $boardId = $task->column->board_id;

        Task::where('column_id', $task->column_id)
            ->where('position', '>', $task->position)
            ->decrement('position');

        Task::where('column_id', $request->column_id)
            ->where('position', '>=', $request->position)
            ->increment('position');

        $task->update([
            'column_id' => $request->column_id,
            'position'  => $request->position,
        ]);

        // ✅ Broadcast pindah card
        broadcast(new BoardUpdated(
            boardId: $boardId,
            type:    'card_moved',
            payload: [
                'task_id'   => $task->id,
                'column_id' => $request->column_id,
                'position'  => $request->position,
            ],
            actor: ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json($task->fresh()->load('assignee'));
    }

    public function destroy(Task $task)
    {
        $boardId  = $task->column->board_id;
        $taskId   = $task->id;
        $columnId = $task->column_id;
        $task->delete();

        // ✅ Broadcast hapus card
        broadcast(new BoardUpdated(
            boardId: $boardId,
            type:    'card_deleted',
            payload: ['task_id' => $taskId, 'column_id' => $columnId],
            actor:   ['id' => auth()->id(), 'name' => auth()->user()->name],
        ));

        return response()->json(null, 204);
    }
}