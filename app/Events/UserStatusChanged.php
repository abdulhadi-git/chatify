<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserStatusChanged implements ShouldBroadcast, ShouldQueue
{
    use InteractsWithSockets, SerializesModels, Dispatchable;

    public function __construct(
        public int $userId,
        public bool $isOnline,
        public int $contactId,
        public array $chatIds
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('User.' . $this->contactId)];
    }

    public function broadcastAs(): string
    {
        return 'statusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'userId'   => $this->userId,
            'isOnline' => $this->isOnline,
            'chatIds' => $this->chatIds
        ];
    }
}