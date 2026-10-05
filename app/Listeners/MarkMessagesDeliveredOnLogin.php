<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Auth\Events\Login;
use App\Models\messages;
use App\Models\chat;
use App\Events\updateMessagesStatusEvent;
use App\Models\message_recipients;
use Illuminate\Support\Facades\Cache;
use App\Events\updateMessageStatusEvent; // apna actual namespace confirm kar lena

class MarkMessagesDeliveredOnLogin
{
    public function __construct()
    {
        //
    }

    public function handle(Login $event): void
    {
        $userId = $event->user->id;

        // Update se PEHLE wo saare messages nikal lo jinka status 'sent' hai
        // — sender_id, id, chat_id sath mein, taake update ke baad ye data
        // mil na sake tou dikkat na ho.
        $messages = messages::whereIn('chat_id', function ($q) use ($userId) {
                $q->select('chat_id')
                    ->from('chat_user')
                    ->where('user_id', $userId);
            })
            ->where('sender_id', '!=', $userId)
            ->whereHas('recipients', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('status', 'sent');
            })
            ->select('id', 'sender_id', 'chat_id')
            ->get();

        if ($messages->isEmpty()) {
            return;
        }

        $messageIds = $messages->pluck('id');
        $affectedChatIds = $messages->pluck('chat_id')->unique();

        // Ab actual update message_recipients table pe, sirf isi user ke liye,
        // aur sirf unhi messages ke liye jo humne upar nikale
        message_recipients::where('user_id', $userId)
            ->where('status', 'sent')
            ->whereIn('message_id', $messageIds)
            ->update(['status' => 'delivered']);

        Chat::whereIn('id', $affectedChatIds)
            ->pluck('chat_hash')
            ->each(function ($chat_hash) {
                Cache::forget('chat-messages-' . $chat_hash . '-initial');
            });

        // Har message ke sender ko event fire karo taake unki screen par
        // tick 'delivered' show ho
        foreach ($messages as $message) {
            broadcast(new updateMessagesStatusEvent(
                $message,
                'delivered',
                $message->sender_id
            ));
        }
    }
}