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

class editMessageContent implements ShouldBroadcast, ShouldQueue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $chatId;
    public $msgId;
    public $recipients;
    public $newMsg;
    public function __construct($chatId, $msg, $newMsg)
    {
        $this->chatId = $chatId;
        $this->msgId = $msg->id;
        $this->recipients = $msg->recipients->whereIn('status', ['delivered', 'seen'])->pluck('user_id')->toArray();
        $this->newMsg = $newMsg;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastAs(): string
    {
        return 'updateMsg';
    }

    public function broadcastWith(): array
    {
        return [
            'chatId'   => $this->chatId,
            'msgId' => $this->msgId,
            'newMsg' => $this->newMsg
        ];
    }
    public function broadcastOn(): array
    {
        foreach ($this->recipients as $recipientId) {
            $channels[] = new PrivateChannel('User.' . $recipientId);
        }
        return $channels;
    }
}
