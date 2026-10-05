<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class incomingMessages implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $msg;
    public $recievers;
    public function __construct($msg, $recievers)
    {
        $this->msg = $msg;
        $this->recievers = $recievers;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastAs(): string
    {
        return 'incomingMessages';
    }
    public function broadcastWith(): array
{
    return [
        'id'         => $this->msg->id,   // <-- ye add karna zaroori hai
        'chat_id'    => $this->msg->chat_id,
        'sender_id'  => $this->msg->sender_id,
        'message'    => $this->msg->message,
        'type'       => $this->msg->type,
        'file_size'  => $this->msg->type === 'file' ? $this->msg->file_size : null,
        'status'     => $this->msg->status,
        'created_at' => $this->msg->created_at
    ];
}
    public function broadcastOn(): array
    {
        return collect($this->recievers)
            ->unique()
            ->map(fn($uid) => new PrivateChannel('User.' . $uid))
            ->values()
            ->all();
    }
}
