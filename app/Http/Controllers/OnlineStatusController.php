<?php

namespace App\Http\Controllers;

use App\Events\UserStatusChanged;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OnlineStatusController extends Controller
{
private function broadcastOnChats(int $userId, bool $isOnline): void
{
    $user = auth()->user();

    // 1. Meri active chats (jo maine mute nahi ki)
    $activeChatIds = $user->chats()
        ->where('chats.status', 'active')
        ->wherePivot('is_muted', false)
        ->pluck('chats.id');

    // 2. In chats ke dusre members: user_id => [chat_ids]
    $chatsByUser = DB::table('chat_user')
        ->whereIn('chat_id', $activeChatIds)
        ->where('user_id', '!=', $user->id)
        ->get(['user_id', 'chat_id'])
        ->groupBy('user_id')
        ->map(fn ($rows) => $rows->pluck('chat_id')->unique()->values()->all());

    // 3. Sirf wo jo mere contacts me hain
    $contactIds = $user->contacts()
        ->whereIn('contact_id', $chatsByUser->keys())
        ->pluck('contact_id');

    // 4. Har contact ko uski common chat ids ke saath bhejo
    foreach ($contactIds as $contactId) {
        UserStatusChanged::dispatch(
            $userId,
            $isOnline,
            $contactId,
            $chatsByUser[$contactId] ?? []
        );
    }
}
    public function markOnline(Request $request)
    {
        $userId = Auth::id();
        $wasOffline = ! Cache::has('user-online-' . $userId);

        Cache::put('user-online-' . $userId, true, now()->addMinutes(5));

        if ($wasOffline) {
            $this->broadcastOnChats($userId, true);
        }

        return response()->json(['status' => 'online']);
    }

    public function markOffline(Request $request)
    {
        $userId = Auth::id();
        Cache::forget('user-online-' . $userId);

        $this->broadcastOnChats($userId, false);

        return response()->json(['status' => 'offline']);
    }
}
