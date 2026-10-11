<?php
// app/Events/BoardUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BoardUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int    $boardId,
        public string $type,    // 'column_reordered' | 'card_moved' | 'card_created' | 'card_updated' | 'card_deleted' | 'column_created' | 'column_deleted' | 'column_renamed'
        public array  $payload, // data perubahan
        public array  $actor,   // { id, name } user yang melakukan perubahan
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("board.{$this->boardId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'board.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'type'      => $this->type,
            'payload'   => $this->payload,
            'actor'     => $this->actor,
            'timestamp' => now()->toISOString(),
        ];
    }
}