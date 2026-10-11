<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return $board->owner_id === $user->id
            || $board->members()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Board $board): bool
    {
        $member = $board->members()->where('user_id', $user->id)->first();
        return $board->owner_id === $user->id
            || in_array($member?->pivot?->role, ['owner', 'member', 'admin']);
    }

    public function delete(User $user, Board $board): bool
    {
        return $board->owner_id === $user->id;
    }
}