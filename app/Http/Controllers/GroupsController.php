<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\chat_user;
use App\Models\chat;

class GroupsController extends Controller
{
    private function AuthUserWithGroups()
    {
        return auth()->user()->with(['groups' => function ($query) {
            $query->where('status', 'active');
        }, 'groups.users' => function ($query) {
            $query->wherePivot('is_muted', false);
        }])->first();
    }
    public function showGroups()
    {
        $authUser = $this->AuthUserWithGroups();
        return view('Main.groups', compact('authUser'));
    }

    public function groupDetails($group_hash)
    {
        $fetchGroupFromCache = Cache::get('group_' . $group_hash);
        if ($fetchGroupFromCache) {
            return response()->json([
                'success' => true,
                'source' => 'cache',
                'group' => $fetchGroupFromCache
            ]);
        }

        $group = auth()->user()->groups()
            ->where('chat_hash', $group_hash)
            ->with(['users' => function ($query) {
                $query->wherePivot('is_muted', false);
            }])
            ->firstOrFail();
        if ($group) {
            Cache::put('group_' . $group_hash, $group, now()->addhours(2));
            return response()->json([
                'success' => true,
                'source' => 'database',
                'group' => $group
            ]);
        }
        return response()->json([
            'success' => false,
            'message' => 'Group not found'
        ]);
    }
    public function updateGroupAvatar(Request $request)
    {
        $request->validate([
            'groupId' => 'required|string',
            'avatar' => 'required|image|max:2048', // max 2MB
        ]);
        $group = auth()->user()->groups()->where('chat_id', (int) $request->groupId)->first();
        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found'
            ]);
        }
        $path = $request->file('avatar')->store('avatars', 'public');
        $group->avatar = $path;
        $group->save();

        $groupCacheKey = 'group_' . $group->chat_hash;
        $groupCache = Cache::get($groupCacheKey);
        if ($groupCache) {
            $groupCache->avatar = $path;
            Cache::put($groupCacheKey, $groupCache, now()->addHours(2));
        }
        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully',
            'avatar' => $path
        ]);
    }
    public function removeAvatar(Request $request)
    {
        $group = auth()->user()->groups()->where('chat_id', (int) $request->groupId)->first();
        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found.'
            ]);
        }
        $avatar = $group->avatar;

        $confirmDelete = Storage::disk('public')->delete($avatar);
        if (!$confirmDelete) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting avatar.'
            ]);
        }
        $group->avatar = null;
        $group->save();

        $cacheKey = 'group_' . $group->chat_hash;
        $groupCache = Cache::get($cacheKey);
        if ($groupCache) {
            $groupCache->avatar = null;
            Cache::put('group_' . $group->chat_hash, $groupCache);
        }
        return response()->json([
            'success' => true,
            'message' => 'Avatar removed.',
            'defaultAvatar' => 'avatars/defaultGroup.png'
        ]);
    }
    public function removeMember(Request $request)
    {
        $request->validate([
            'groupId' => 'required|exists:chats,id',
            'userId' => 'required|exists:users,id'
        ]);

        $group = auth()->user()->groups()->where('chat_id', $request->groupId)->first();
        $groupMember = chat_user::where('chat_id', $request->groupId)->where('user_id', $request->userId)->first();
        if (!$groupMember) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing member.'
            ]);
        }
        $groupMember->delete();

        $cacheKey = 'group_' . $group->chat_hash;
        $groupCache = Cache::get($cacheKey);

        if ($groupCache) {
            $updatedUsers = $groupCache->users->reject(function ($user) use ($request) {
                return $user->id === $request->userId;
            })->values();

            $groupCache->setRelation('users', $updatedUsers);

            Cache::put($cacheKey, $groupCache);
        }
        return response()->json([
            'success' => true,
            'message' => 'User removed.',
        ]);
    }
    public function deleteGroup(Request $request)
    {
        $request->validate([
            'groupId' => 'required|exists:chats,id'
        ]);
        $group = auth()->user()->groups()->where('chat_id', $request->groupId)->first();
        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found.'
            ]);
        }
        $group->status = 'inactive';
        $group->save();

        $cacheKey = 'group_' . $group->chat_hash;
        $groupCache = Cache::get($cacheKey);
        if ($groupCache) {
            $groupCache->status = 'inactive';
            Cache::put($cacheKey, $groupCache);
        }
        return response()->json([
            'success' => true,
            'message' => 'Group deleted.'
        ]);
    }
    public function groupContacts(Request $request)
    {
        $excludeIds = $request->filled('groupId')
            ? DB::table('chat_user')
            ->where('chat_id', $request->integer('groupId'))
            ->pluck('user_id')
            : collect();

        $paginator = auth()->user()->contacts()
            ->where('status', 'added')
            ->whereHas('user', fn($q) => $q->whereNotIn('users.id', $excludeIds))
            ->with('user:id,name,user_name,avatar')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate(15);

        $contacts = $paginator->getCollection()
            ->map(fn($c) => [
                'id'     => $c->user->id,
                'name'   => $c->user->name,
                'avatar' => $c->user->avatar,
            ])
            ->values();

        return response()->json([
            'success'  => true,
            'contacts' => $contacts,
            'has_more' => $paginator->hasMorePages(),
        ]);
    }

    public function createGroups(Request $request)
    {
        $validated = $request->validate([
            'title'     => ['required', 'string', 'max:100'],
            'avatar'    => ['nullable', 'image', 'max:2048'],
            'users'     => ['required', 'array', 'min:1'],
            'users.*'   => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $authId = auth()->id();

        $memberIds = collect($validated['users'])
            ->push($authId)
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values();

        $avatarPath = null;

        try {
            $chat = DB::transaction(function () use ($request, $validated, $authId, $memberIds, &$avatarPath) {
                if ($request->hasFile('avatar')) {
                    $avatarPath = $request->file('avatar')->store('avatars', 'public');
                }

                $chat = Chat::create([
                    'type'       => 'group',
                    'title'      => $validated['title'],
                    'avatar'     => $avatarPath,
                    'created_by' => $authId
                ]);

                $chat->users()->attach($memberIds->all());

                return $chat;
            });
        } catch (\Throwable $e) {
            report($e);

            if ($avatarPath) {
                Storage::disk('public')->delete($avatarPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create group. Please try again later.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Group created.',
            'group'   => [
                'id'            => $chat->id,
                'chat_hash'     => $chat->chat_hash,
                'title'         => $chat->title,
                'avatar'        => $chat->avatar,
                'created_by'    => $chat->created_by,
                'members_count' => $memberIds->count(),
            ],
        ], 201);
    }
    public function addMembers(Request $request)
    {
        $validated = $request->validate([
            'groupId' => ['required', 'integer', 'exists:chats,id'],
            'users'   => ['required', 'array', 'min:1'],
            'users.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $chat = Chat::where('id', $validated['groupId'])
            ->where('type', 'group')
            ->firstOrFail();

        if ((int) $chat->created_by !== (int) auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Only the group admin can add members.',
            ], 403);
        }

        try {
            $chat->users()->syncWithoutDetaching(
                collect($validated['users'])->map(fn($id) => (int) $id)->unique()->all()
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add members. Please try again later.',
            ], 500);
        }
        $cacheKey = 'group_' . $chat->chat_hash;
        $groupCache = Cache::get($cacheKey);
        if ($groupCache) {
            Cache::forget($cacheKey);
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Members added.',
            'members_count' => $chat->users()->count(),
        ]);
    }
}
