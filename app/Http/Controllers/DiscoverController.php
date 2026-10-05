<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\user_contacts;
use Illuminate\Support\Facades\DB;

class DiscoverController extends Controller
{
    public function discover()
    {
        return view('Main.discover');
    }

    public function search(Request $request)
    {
        $request->validate([
            'query'    => ['required', 'string', 'min:1', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query   = trim($request->input('query'));
        $perPage = (int) $request->input('per_page', 10);

        $paginator = User::query()
            ->where('id', '!=', auth()->id()) // apne aap ko results me na dikhayein
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('user_name', 'LIKE', "%{$query}%");
            })
            ->orderBy('name')
            ->paginate($perPage);

        $users = $paginator->getCollection()->map(function (User $user) {
            return [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->user_name,
                'avatar'   => $user->avatar,
            ];
        });

        return response()->json([
            'success'      => true,
            'users'        => $users,
            'current_page' => $paginator->currentPage(),
            'has_more'     => $paginator->hasMorePages(),
        ]);
    }
    public function openProfile(string $userId)
    {
        $user = User::where('id', $userId)->first(); // apne actual hash column ka naam use karein

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'username'      => $user->user_name,
                'avatar'        => $user->avatar,
                'bio'           => $user->bio,
                'friend_status' => $this->resolveFriendStatus($user->id),
            ],
        ]);
    }

    /**
     * Auth user aur target user ke darmiyan contact status nikalta hai.
     * Schema: user_contacts (user_id, contact_id, status)
     * status values: 'added', 'pending', 'blocked'
     */
    private function resolveFriendStatus(int $targetUserId): string
    {
        $authId = auth()->id();

        if ($authId === $targetUserId) {
            return 'self';
        }

        // Auth user ne khud target ko add/request/block kiya ho
        $outgoing = DB::table('user_contacts')
            ->where('user_id', $authId)
            ->where('contact_id', $targetUserId)
            ->first();

        // Target ne auth user ko add/request/block kiya ho (reverse direction)
        $incoming = DB::table('user_contacts')
            ->where('user_id', $targetUserId)
            ->where('contact_id', $authId)
            ->first();

        if (empty($outgoing) && $incoming?->status === 'added') {
            return 'reconnect';
        }
        if ($outgoing?->status === 'blocked' || $incoming?->status === 'blocked') {
            return 'friends';
        }

        if ($outgoing?->status === 'added' || $incoming?->status === 'added') {
            return 'friends';
        }

        if ($outgoing?->status === 'pending') {
            return 'pending';
        }

        return 'none';
    }

    public function addFriend(Request $request)
    {
        $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $authId     = auth()->id();
        $targetId   = (int) $request->input('userId');
        $userChat = auth()->user()->chats()->where('type', 'direct')
            ->whereHas('users', function ($query) use ($targetId) {
                $query->where('users.id', $targetId);
            })
            ->first();

        if ($authId === $targetId) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot add yourself.',
            ], 422);
        }

        // Auth user ne pehle hi target ko row bhej rakhi ho (outgoing)
        $outgoing = DB::table('user_contacts')
            ->where('user_id', $authId)
            ->where('contact_id', $targetId)
            ->first();

        // Target ne pehle hi auth user ko row bhej rakhi ho (incoming)
        $incoming = DB::table('user_contacts')
            ->where('user_id', $targetId)
            ->where('contact_id', $authId)
            ->first();

        if (empty($outgoing) && $incoming?->status === 'added') {
            DB::table('user_contacts')
                ->insert([
                    'user_id' => $authId,
                    'contact_id' => $targetId,
                    'status' => 'added',
                    'updated_at' => now(),
                    'created_at' => now()
                ]);
            if ($userChat) {
                $userChat->status = 'active';
                $userChat->save();
            }
            return response()->json([
                'success' => true,
                'message' => 'Reconnected.',
                'friend_status' => 'friends'
            ]);
        }
        // ---- Already blocked (kisi bhi taraf se) ----
        if ($outgoing?->status === 'blocked' || $incoming?->status === 'blocked') {
            return response()->json([
                'success' => false,
                'message' => 'Unable to send friend request.',
            ], 422);
        }

        // ---- Already friends ----
        if ($outgoing?->status === 'added' || $incoming?->status === 'added') {
            return response()->json([
                'success'       => true,
                'message'       => 'You are already friends.',
                'friend_status' => 'friends',
            ]);
        }

        // ---- Auth user ne pehle hi request bhej rakhi hai ----
        if ($outgoing?->status === 'pending') {
            return response()->json([
                'success'       => true,
                'message'       => 'Friend request already sent.',
                'friend_status' => 'pending',
            ]);
        }

        // ---- Target ne pehle hi request bheji thi -> ab dono side se confirm ho gaya, accept kar dein ----
        if ($incoming?->status === 'pending') {
            DB::table('user_contacts')
                ->where('user_id', $targetId)
                ->where('contact_id', $authId)
                ->update(['status' => 'added', 'updated_at' => now()]);
            user_contacts::create([
                'user_id' => $authId,
                'contact_id' => $targetId,
                'status' => 'added',
            ]);
                
            if ($userChat) {
                $userChat->status = 'active';
                $userChat->save();
            }
            return response()->json([
                'success'       => true,
                'message'       => 'Friend request accepted.',
                'friend_status' => 'friends',
            ]);
        }

        // ---- Koi row hi nahi -> naya pending request bana dein ----
        DB::table('user_contacts')->insert([
            'user_id'    => $authId,
            'contact_id' => $targetId,
            'status'     => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success'       => true,
            'message'       => 'Friend request sent.',
            'friend_status' => 'pending',
        ]);
    }
}
