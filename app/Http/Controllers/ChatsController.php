<?php

namespace App\Http\Controllers;

use App\Events\editMessageContent;
use App\Events\messageSentEvent;
use App\Events\deleteMsgEvent;
use App\Events\updateMessagesStatusEvent;
use App\Events\incomingMessages;
use App\Events\markAllMessagesStatus;
use Illuminate\Http\Request;
use App\Models\chat;
use App\Models\chat_user;
use App\Models\message_deletions;
use App\Models\messages;
use App\Models\message_recipients;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\User;

class ChatsController extends Controller
{
    private function AuthUserWithChats()
    {
        return User::with([
            'chats' => function ($query) {
                $query->latest('updated_at')
                    ->limit(10);
            },
            'chats.users',
            'contacts',
            'chats.lastMsg',
            'chats.unreadCount'
        ])->where('id', auth()->id())->first();
    }

    public function showChats()
    {
        $authUser = $this->AuthUserWithChats();
        return view('Main.chats', compact('authUser'));
    }

    public function loadMoreChats(Request $request)
    {
        $userId  = auth()->id();
        $perPage = 10;
        $page    = (int) $request->input('page', 2); // page 1 already loaded on initial view

        $chats = Chat::whereHas('users', function ($q) use ($userId) {
            $q->where('users.id', $userId);
        })
            ->with(['users', 'lastMsg', 'unreadCount'])
            ->latest('updated_at')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $html = '';
        foreach ($chats as $chat) {
            $html .= view('Main.partials.chat-item', ['chat' => $chat, 'authId' => $userId])->render();
        }

        return response()->json([
            'success' => true,
            'html'    => $html,
            'hasMore' => $chats->count() === $perPage,
        ]);
    }

    public function startChat(Request $request)
    {
        $userId = (int) $request->contact['id'];

        $userChat = auth()->user()->chats()->where('type', 'direct')
            ->whereHas('users', function ($query) use ($userId) {
                $query->where('users.id', $userId);
            })
            ->first();

        if (empty($userChat)) {
            $userChat = chat::create([
                'type' => 'direct',
                'created_by' => auth()->id()
            ]);
            chat_user::create([
                'chat_id' => $userChat->id,
                'user_id' => auth()->id(),
                'role' => 'member',
            ]);
            chat_user::create([
                'chat_id' => $userChat->id,
                'user_id' => $userId,
                'role' => 'member',
            ]);
        };

        return response()->json([
            'success' => true,
            'chat_hash' => $userChat->chat_hash
        ]);
    }

    public function showParticularChat($chat_hash)
    {
        $authUser = $this->AuthUserWithChats();
        return view('Main.chats', compact('authUser', 'chat_hash'));
    }

    /* ====================================================================== */

    public function getMessages(Request $request, $chatHash)
    {
        $chat = chat::where('chat_hash', $chatHash)->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found'
            ], 404);
        }

        $chatId = $chat->id;
        $userId = auth()->id();

        // Apne actual chat type column ke mutabiq change karna
        $isGroup = ($chat->type ?? null) === 'group';

        // Group member ki mute/removal details
        $membership = null;
        $mutedAt = null;

        if ($isGroup) {
            $membership = DB::table('chat_user')
                ->where('chat_id', $chatId)
                ->where('user_id', $userId)
                ->first();

            // Group ka member hona zaroori hai
            if (!$membership) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a member of this group.'
                ], 403);
            }

            if ($membership->is_muted && $membership->muted_at) {
                $mutedAt = $membership->muted_at;
            }
        }

        // Shared cache key (baaki controllers ke saath compatible)
        $cacheKey = 'chat-messages-' . $chatHash . '-initial';

        /*
        |--------------------------------------------------------------------------
        | Mark messages as seen
        |--------------------------------------------------------------------------
        */

        $seenQuery = messages::where('chat_id', $chatId)
            ->where('sender_id', '!=', $userId);

        // Removed/muted user ko cutoff ke baad ke messages seen mark nahi karne
        if ($isGroup && $mutedAt) {
            $seenQuery->where('created_at', '<', $mutedAt);
        }

        $messagesIds = $seenQuery->pluck('id');

        $updatedCount = message_recipients::whereIn('message_id', $messagesIds)
            ->where('user_id', $userId)
            ->where('status', '!=', 'seen')
            ->update([
                'status' => 'seen',
                'seen_at' => now(),
                'updated_at' => now(),
            ]);

        if ($updatedCount > 0) {
            Cache::forget($cacheKey);

            $participantIds = $chat->users()
                ->where('users.id', '!=', $userId)
                ->pluck('users.id')
                ->toArray();

            broadcast(
                new markAllMessagesStatus(
                    $chatId,
                    'seen',
                    $participantIds
                )
            )->toOthers();
        }

        /*
        |--------------------------------------------------------------------------
        | Common message query
        |--------------------------------------------------------------------------
        */

        $paginatePerRequest = 30;

        $buildMessagesQuery = function () use (
            $chatId,
            $userId,
            $isGroup,
            $mutedAt
        ) {
            $query = messages::where('chat_id', $chatId)
                ->whereDoesntHave('deletions', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->where('is_deleted_for_everyone', false);

            // Group messages: cutoff se pehle ke messages hi visible honge
            if ($isGroup && $mutedAt) {
                $query->where('created_at', '<', $mutedAt);
            }

            return $query;
        };

        /*
        |--------------------------------------------------------------------------
        | Cache (sirf un users ke liye jin par koi personal filter nahi)
        |--------------------------------------------------------------------------
        */

        // "Delete for me" ya mute cutoff wale user ka result shared cache mein
        // nahi jana chahiye, aur na hi usay shared cache se data milna chahiye.
        $hasPersonalFilter = ($isGroup && $mutedAt)
            || message_deletions::where('user_id', $userId)
                ->whereIn('message_id', messages::where('chat_id', $chatId)->select('id'))
                ->exists();

        $useCache = !$hasPersonalFilter;

        $fetchFromCache = $useCache ? Cache::get($cacheKey) : null;

        if (!empty($fetchFromCache)) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'source' => 'cache',
                    'messages' => $fetchFromCache['messages'],
                    'hasMore' => $fetchFromCache['hasMore'],
                ]);
            }

            return redirect()->route('specific.chat', $chatHash);
        }

        /*
        |--------------------------------------------------------------------------
        | Total messages and pagination
        |--------------------------------------------------------------------------
        */

        $totalMessages = $buildMessagesQuery()->count();

        $messages = $buildMessagesQuery()
            ->orderBy('created_at', 'desc')
            ->take($paginatePerRequest)
            ->get()
            ->reverse()
            ->values();

        $messages = $this->attachAggregateStatus($messages);

        $hasMore = $totalMessages > $paginatePerRequest;

        if ($useCache) {
            Cache::put($cacheKey, [
                'messages' => $messages,
                'hasMore' => $hasMore,
            ], now()->addHours(2));
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'source' => 'db',
                'messages' => $messages,
                'hasMore' => $hasMore,
            ]);
        }

        return redirect()->route('specific.chat', $chatHash);
    }

    // Viewer-independent: har user ke liye same result, taake shared cache safe rahe
    private function attachAggregateStatus($messagesCollection)
    {
        $messageIds = $messagesCollection->pluck('id')->all();

        if (empty($messageIds)) {
            return $messagesCollection;
        }

        $allStatuses = message_recipients::whereIn('message_id', $messageIds)->get()
            ->groupBy('message_id');

        return $messagesCollection->map(function ($msg) use ($allStatuses) {
            $statuses = $allStatuses->get($msg->id, collect());

            if ($statuses->isEmpty()) {
                $msg->status = $msg->status ?? 'sent';
            } elseif ($statuses->every(fn($s) => $s->status === 'seen')) {
                $msg->status = 'seen';
            } elseif ($statuses->contains(fn($s) => in_array($s->status, ['delivered', 'seen']))) {
                $msg->status = 'delivered';
            } else {
                $msg->status = 'sent';
            }

            return $msg;
        });
    }

    public function loadMoreMessages(Request $request, $chatHash)
    {
        $paginatePerRequest = 30;

        // beforeId = sabse purane message ka id jo abhi screen pe hai
        $beforeId = $request->input('before_id');

        if (empty($beforeId)) {
            return response()->json([
                'success' => false,
                'message' => 'before_id is required',
            ], 422);
        }

        $chat = chat::where('chat_hash', $chatHash)->first();
        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        $chatId = $chat->id;

        // reference message dhoondo taake uske created_at se pehle wale messages milein
        $referenceMessage = messages::where('id', $beforeId)
            ->where('chat_id', $chatId)
            ->first();

        if (!$referenceMessage) {
            return response()->json(['success' => false, 'message' => 'Invalid before_id'], 422);
        }

        $olderMessages = messages::where('chat_id', $chatId)
            ->where('created_at', '<', $referenceMessage->created_at)
            ->whereDoesntHave('deletions', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->where('is_deleted_for_everyone', false)
            ->orderBy('created_at', 'desc')
            ->take($paginatePerRequest)
            ->get()
            ->reverse()
            ->values();
        $olderMessages = $this->attachAggregateStatus($olderMessages);

        $remainingCount = messages::where('chat_id', $chatId)
            ->where('created_at', '<', $referenceMessage->created_at)
            ->whereDoesntHave('deletions', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->where('is_deleted_for_everyone', false)
            ->count();

        $hasMore = $remainingCount > $paginatePerRequest;

        return response()->json([
            'success' => true,
            'source' => 'db',
            'messages' => $olderMessages,
            'hasMore' => $hasMore,
        ]);
    }

    public function sendMessages(Request $request)
    {
        $chat = Chat::where('id', $request->chatId)->first();

        if (!$chat || $chat->status === 'inactive') {
            return response()->json(['success' => false, 'message' => 'Something went wrong.'], 404);
        }

        $cacheKey = 'chat-messages-' . $chat->chat_hash . '-initial';

        $msg = messages::create([
            'chat_id'    => (int) $request->chatId,
            'sender_id'  => $request->sender_id,
            'message'    => $request->message,
            'type'       => 'text',
            'file_path'  => null,
            'file_size'  => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($msg) {
            $this->createStatusRowsForMessage($msg, $chat, $request->sender_id);

            // chat ka updated_at bump — chat list ordering ke liye zaroori
            $chat->update(['updated_at' => now()]);

            $recievers = $chat->users->where('id', '!=', $msg->sender_id)->pluck('id')->unique();

            Cache::forget($cacheKey);

            broadcast(new incomingMessages($msg, $recievers));

            return response()->json([
                'success' => true,
                'msg'     => $msg,
                'status'  => $msg->status,
            ]);
        }

        return response()->json([
            'success' => false,
        ]);
    }

    private function createStatusRowsForMessage(messages $msg, $chat, $senderId)
    {
        // Sender ke ilawa chat ke baaki sab members nikalein
        $otherMemberIds = $chat->users()
            ->where('users.id', '!=', $senderId)
            ->pluck('users.id');

        if ($otherMemberIds->isEmpty()) {
            return; // koi aur member nahi (edge case)
        }

        $now = now();

        $rows = $otherMemberIds->map(function ($userId) use ($msg, $now) {
            return [
                'message_id'   => $msg->id,
                'user_id'      => $userId,
                'status'       => 'sent',
                'delivered_at' => null,
                'seen_at'      => null,
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        })->toArray();

        // EK query se sab rows insert
        message_recipients::insert($rows);
    }

    public function sendAttachments(Request $request)
    {
        $chat = Chat::where('id', $request->chatId)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }

        $cacheKey = 'chat-messages-' . $chat->chat_hash . '-initial';

        $file = $request->file('attachment');
        $path = $file->store('chat-attachments', 'public');
        $fileType = Str::before($file->getMimeType(), '/');

        $msg = messages::create([
            'chat_id'    => (int) $request->chatId,
            'sender_id'  => (int) $request->sender_id,
            'type'       => $fileType == 'application' ? 'file' : $fileType,
            'file_path'  => $path,
            'file_size'  => (int) $file->getSize(),
            'message'    => $file->getClientOriginalName(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($msg) {
            $this->createStatusRowsForMessage($msg, $chat, $request->sender_id);

            $chat->update(['updated_at' => now()]);

            Cache::forget($cacheKey);

            $recievers = $chat->users->where('id', '!=', $msg->sender_id)->pluck('id')->unique();
            broadcast(new incomingMessages($msg, $recievers));
        }

        return response()->json([
            'success' => true,
            'msg' => [
                'id' => $msg->id,
            ],
            'file_path' => $msg->file_path,
        ]);
    }

    public function downloadAttachments(Request $request)
    {
        $filePath = $request->downloadPath;
        $fileName = messages::where('file_path', $filePath)->value('message');

        if (!Storage::disk('public')->exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        return response()->download(Storage::disk('public')->path($filePath), $fileName);
    }

    public function editMessage(Request $request)
    {
        $messageId = (int) $request->id;
        $newText = $request->message;

        $message = messages::find($messageId);

        if (!$message) {
            return response()->json(['success' => false, 'message' => 'Message not found'], 404);
        }

        $chatId = $message->chat_id;

        $message->message = $newText;
        $message->save();

        // Shared cache clear (patch karne ki zaroorat nahi)
        $cacheKey = 'chat-messages-' . $message->chat->chat_hash . '-initial';
        Cache::forget($cacheKey);

        broadcast(new editMessageContent($chatId, $message, $newText))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Message updated.'
        ]);
    }

    public function deleteMsg(Request $request)
    {
        $messageId = (int) $request->id;
        $mode = $request->mode;

        $message = messages::find($messageId);

        if (!$message) {
            return response()->json(['success' => false, 'message' => 'Message not found'], 404);
        }

        $chatHash = $message->chat->chat_hash;
        $chatId = $message->chat_id;

        if ($mode === 'everyone') {
            $message->is_deleted_for_everyone = true;
            $message->deleted_at_for_everyone = now();
            $message->save();

            broadcast(new deleteMsgEvent($chatId, $message))->toOthers();

            // Sab ke liye badla hai, shared cache clear
            Cache::forget('chat-messages-' . $chatHash . '-initial');
        } else {
            // Delete for me: sirf DB row. Shared cache chhedne ki zaroorat nahi,
            // kyunke is user ke liye getMessages ab cache bypass karega.
            message_deletions::firstOrCreate([
                'message_id' => $messageId,
                'user_id'    => auth()->id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message deleted.'
        ]);
    }

    public function updateStatus(Request $request, $msgId)
    {
        $request->validate([
            'status' => 'required|in:delivered,seen',
        ]);

        $msg = messages::with('chat.users')->where('id', $msgId)->first();

        if (!$msg) {
            return response()->json([
                'success' => false,
                'message' => 'msg not found.'
            ]);
        }

        $userId = auth()->id();
        $now = now();
        $column = $request->status === 'seen' ? 'seen_at' : 'delivered_at';

        $query = message_recipients::where('message_id', $msgId)
            ->where('user_id', $userId);

        if ($request->status === 'delivered') {
            $query->where('status', '!=', 'seen');
        }

        if ($request->status === 'seen') {
            // delivered_at pehle se set ho to overwrite na ho
            $query->update([
                'status'       => 'seen',
                'seen_at'      => $now,
                'delivered_at' => DB::raw("COALESCE(delivered_at, '" . $now->toDateTimeString() . "')"),
                'updated_at'   => $now,
            ]);
        } else {
            $query->update([
                'status'     => $request->status,
                $column      => $now,
                'updated_at' => $now,
            ]);
        }

        // Status cached payload mein bhi hota hai, isliye cache clear
        Cache::forget('chat-messages-' . $msg->chat->chat_hash . '-initial');

        if ($msg->chat->type === 'direct') {
            $sender = $msg->sender_id;
            broadcast(new updateMessagesStatusEvent($msg, $request->status, $sender));
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated.'
        ]);
    }

    public function lastMsg(Request $request)
    {
        $lastMsg = auth()->user()->chats->where('id', $request->chat_id)->first()->lastMsg;
        return response()->json([
            'success' => true,
            'lastMsg' => $lastMsg
        ]);
    }

    public function messageInfo(Request $request)
    {
        $msgStatuses = message_recipients::with('user')->where('message_id', $request->id)->get();
        $recipientsInfo = $msgStatuses->map(function ($msgStatus) {
            return [
                'recipient_name' => $msgStatus->user->name,
                'created_at' => $msgStatus->created_at,
                'delivered_at' => $msgStatus->delivered_at,
                'seen_at' => $msgStatus->seen_at,
                'status' => $msgStatus->status
            ];
        });

        return response()->json([
            'success' => true,
            'info' => $recipientsInfo
        ]);
    }
}