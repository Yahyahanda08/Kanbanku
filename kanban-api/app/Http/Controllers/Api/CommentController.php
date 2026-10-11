<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Task $task)
    {
        return response()->json($task->comments()->with('user')->get());
    }

    public function store(Request $request, Task $task)
    {
        $data = $request->validate([
            'body' => 'required|string',
        ]);

        $comment = $task->comments()->create([
            'body'    => $data['body'],
            'user_id' => $request->user()->id,
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function destroy(Comment $comment)
    {
        $comment->delete();
        return response()->json(null, 204);
    }
}