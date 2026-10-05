<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
Broadcast::channel('Chat.{chatId}', function($user, int $chatId){
    return $user->chats()->where('chats.id', $chatId)->exists();
});
Broadcast::channel('User.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
Broadcast::channel('online-users', function ($user) {
    return $user
        ? ['id' => $user->id, 'name' => $user->name]
        : null;
});