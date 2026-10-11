<?php

// use Illuminate\Support\Facades\Broadcast;
// use App\Models\Board;

// Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
//     return (int) $user->id === (int) $id;
// });

// // Presence channel — hanya member board yang boleh join
// Broadcast::channel('board.{boardId}', function ($user, $boardId) {
//     $board = Board::find($boardId);
//     if (!$board) return false;

//     $isMember = $board->members()->where('user_id', $user->id)->exists()
//               || $board->owner_id === $user->id;

//     if (!$isMember) return false;

//     return [
//         'id'     => $user->id,
//         'name'   => $user->name,
//         'email'  => $user->email,
//         'avatar' => $user->avatar_url ?? null,
//     ];
// });


Broadcast::channel('board.{boardId}', function ($user, $boardId) {
    return [
        'id'   => $user->id,
        'name' => $user->name,
    ];
});