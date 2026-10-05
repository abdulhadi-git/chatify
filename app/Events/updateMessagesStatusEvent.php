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

class updateMessagesStatusEvent implements ShouldBroadcast, ShouldQueue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $status;
    public $msg;
    public $senderId;
    public function __construct($msg, $status, $senderId)
    {
        $this->status = $status;
        $this->msg = $msg;
        $this->senderId = $senderId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastAs(): string
{
    return 'messageStatusUpdated';
}
    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->msg->id,
            'chat_id' => $this->msg->chat_id,
            'status' => $this->status
        ];
    }
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('User.'. $this->senderId),
        ];
    }
}
