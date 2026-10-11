<?php

namespace App\Http\Controllers\Api;

use App\Events\BoardUpdated;
use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $boards = Board::where('owner_id', $request->user()->id)
            ->orWhereHas('members', fn($q) => $q->where('user_id', $request->user()->id))
            ->withCount('columns')
            ->latest()
            ->get();

        return response()->json($boards);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $board = Board::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id'    => $request->user()->id,
        ]);

        $board->members()->attach($request->user()->id, ['role' => 'owner']);

        $board->columns()->createMany([
            ['name' => 'To Do',       'position' => 0],
            ['name' => 'In Progress', 'position' => 1],
            ['name' => 'Done',        'position' => 2],
        ]);

        return response()->json($board->load('columns'), 201);
    }

    public function show(Board $board)
    {
        $userId = auth()->id();
        if ($board->owner_id !== $userId && !$board->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(
            $board->load(['columns.tasks.assignee', 'columns.tasks.comments.user', 'members'])
        );
    }

    public function update(Request $request, Board $board)
    {
        $userId = auth()->id();
        $role   = $board->members()->where('user_id', $userId)->value('role');

        if ($board->owner_id !== $userId && !in_array($role, ['owner', 'member', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $board->update($request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]));

        return response()->json($board);
    }

    public function destroy(Board $board)
    {
        if ($board->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $board->delete();
        return response()->json(null, 204);
    }

    public function invite(Request $request, Board $board)
    {
        $userId = auth()->id();
        $role   = $board->members()->where('user_id', $userId)->value('role');

        if ($board->owner_id !== $userId && !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role'  => 'in:member,viewer',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();

        if ($board->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Pengguna sudah menjadi anggota board ini.'], 422);
        }

        $board->members()->attach($user->id, [
            'role' => $request->role ?? 'member',
        ]);

        return response()->json(['message' => 'Undangan berhasil dikirim.', 'user' => $user]);
    }

    public function removeMember(Board $board, User $user)
    {
        $userId = auth()->id();
        $role   = $board->members()->where('user_id', $userId)->value('role');

        if ($board->owner_id !== $userId && !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($board->owner_id === $user->id) {
            return response()->json(['message' => 'Tidak bisa menghapus owner board.'], 422);
        }

        $board->members()->detach($user->id);
        return response()->json(['message' => 'Anggota berhasil dihapus.']);
    }

    public function updateMemberRole(Request $request, Board $board, User $user)
    {
        $userId = auth()->id();
        $role   = $board->members()->where('user_id', $userId)->value('role');

        if ($board->owner_id !== $userId && !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate(['role' => 'required|in:member,viewer,admin,owner']);
        $board->members()->updateExistingPivot($user->id, ['role' => $request->role]);

        return response()->json(['message' => 'Role berhasil diupdate.']);
    }

    public function reorderColumns(Request $request, Board $board)
    {
        $userId = auth()->id();
        $role   = $board->members()->where('user_id', $userId)->value('role');

        if ($board->owner_id !== $userId && !in_array($role, ['owner', 'member', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'columns'   => 'required|array',
            'columns.*' => 'integer|exists:columns,id',
        ]);

        foreach ($request->columns as $position => $columnId) {
            $board->columns()
                  ->where('id', $columnId)
                  ->update(['position' => $position]);
        }

        // ✅ Broadcast ke semua user di board
        broadcast(new BoardUpdated(
            boardId: $board->id,
            type:    'column_reordered',
            payload: ['column_ids' => $request->columns],
            actor:   ['id' => $userId, 'name' => auth()->user()->name],
        ));

        return response()->json(['message' => 'Urutan kolom berhasil diupdate.']);
    }

    public function activity($boardId)
    {
        $board  = Board::findOrFail($boardId);
        $userId = auth()->id();

        if ($board->owner_id !== $userId && !$board->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $activities = \App\Models\Activity::where('board_id', $board->id)
            ->with('user:id,name')
            ->latest()
            ->take(50)
            ->get();

        return response()->json($activities);
    }

    public function logActivity(Request $request, $boardId)
    {
        $board  = Board::findOrFail($boardId);
        $userId = auth()->id();

        if ($board->owner_id !== $userId && !$board->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $activity = \App\Models\Activity::create([
            'board_id' => $board->id,
            'user_id'  => $userId,
            'action'   => $request->input('action'),
            'data'     => $request->input('data'),
        ]);

        return response()->json($activity, 201);
    }
}