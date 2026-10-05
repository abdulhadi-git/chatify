<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Broadcast;

class markAllMessagesStatus implements ShouldBroadcast, ShouldQueue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $status;
    public $participantIds; // chat ke doosre members ki ids

    public function __construct($chatId, $status, $participantIds)
    {
        $this->chatId = $chatId;
        $this->status = $status;
        $this->participantIds = $participantIds;
    }

    public function broadcastAs(): string
    {
        return $this->status === 'seen' ? 'markAsSeen' : 'markAsDelivered';
    }

    public function broadcastWith(): array
    {
        return [
            'status' => $this->status,
            'chatId' => $this->chatId,
        ];
    }

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('Chat.' . $this->chatId)];

        foreach ($this->participantIds as $uid) {
            $channels[] = new PrivateChannel('User.' . $uid);
        }

        return $channels;
    }
}
