<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use App\Mail\notifyPasswordUpdate;
use App\Events\UserStatusChanged;


class SettingsController extends Controller
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
            ->map(fn($rows) => $rows->pluck('chat_id')->unique()->values()->all());

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

    public function showSettings()
    {
        return view('Main.settings');
    }

    public function updatePassword(Request $request)
    {
        $user = auth()->user();
        $key = 'password-change:' . $user->id;

        if (RateLimiter::tooManyAttempts($key, 1)) {
            $mins = ceil(RateLimiter::availableIn($key) / 60);
            return response()->json([
                'success' => false,
                'message' => "You can change your password again in {$mins} minutes.",
            ], 429);
        }

        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        RateLimiter::hit($key, 3 * 60 * 60);

        Mail::to($user->email)->send(new notifyPasswordUpdate(
            name: $user->name,
            time: now()->format('j M Y, g:i A'),
            ip: $request->ip(),
            device: $request->userAgent(),
        ));

        return response()->json(['success' => true, 'message' => 'Password updated successfully.']);
    }
    public function showBlockedUsers(Request $request)
    {
        $contacts = auth()->user()
            ->blockedUsers()
            ->with('user:id,name,user_name,avatar')
            ->orderByDesc('updated_at')
            ->paginate(15);

        return response()->json([
            'success'   => true,
            'users'     => $contacts->getCollection()
                ->filter(fn($c) => $c->user)
                ->map(fn($c) => [
                    'id'        => $c->user->id,
                    'name'      => $c->user->name,
                    'user_name' => $c->user->user_name,
                    'avatar'    => $c->user->avatar,
                ])
                ->values(),
            'total'     => $contacts->total(),
            'next_page' => $contacts->hasMorePages() ? $contacts->currentPage() + 1 : null,
        ]);
    }
    public function unblockContact(Request $request)
    {
        $request->validate([
            'userId' => 'required|exists:users,id',
        ]);

        $contact = auth()->user()->contacts()
            ->where('contact_id', $request->userId)
            ->where('status', 'blocked')
            ->first();

        if (!$contact) {
            return response()->json([
                'success' => false,
                'message' => 'Contact not found or not blocked.',
            ], 404);
        }

        $contact->update(['status' => 'added']);
        $chat = auth()->user()->chats()
            ->whereHas('users', function ($query) use ($request) {
                $query->where('user_id', $request->userId);
            })
            ->where('type', 'direct')
            ->first();
        if ($chat) {
            $chat->update(['status' => 'active']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Contact unblocked successfully.',
        ]);
    }
    public function logout(Request $request)
    {
        $user_id = auth()->id();
        $userStatus = Cache::get('user-online-' . $user_id);
        if ($userStatus) {
            Cache::forget('user-online-' . $user_id);
            $this->broadcastOnChats($user_id, false);
        }
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true, 'message' => 'Logged out successfully.', 'redirect' => route('show-sign-in')]);
    }
}
