<?php

namespace App\Http\Controllers;

use App\Models\user_contacts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactsController extends Controller
{
   public function showContacts()
{
    $authId = auth()->id();

    $contacts = user_contacts::with('user')
        ->where('user_id', $authId)
        ->whereIn('status', ['added', 'blocked'])
        ->where('contact_id', '!=', $authId) // khud ko exclude karne ke liye (column ka naam apne hisaab se rakhein)
        ->get()
        ->sortBy(fn ($contact) => strtoupper(substr($contact->user->name ?? '', 0, 1)))
        ->values();

    return view('Main.contacts', compact('contacts'));
}
    public function blockContact(Request $request)
    {
        $allContact = user_contacts::with('user')->where('user_id', auth()->id())->get();
        $contact = $allContact->where('contact_id', $request->contact['id'])->first();
        if ($contact) {
            $contact->update([
                'status' => 'blocked'
            ]);
            $chat = auth()->user()->chats()->where('type', 'direct')
                ->whereHas('users', function ($query) use ($request) {
                    $query->where('users.id', $request->contact['id']);
                })
                ->first();
            if (!empty($chat)) {
                $chat->update([
                    'status' => 'inactive'
                ]);
            }
            return response()->json([
                'success' => true,
                'contact' => $contact,
                'message' => 'Blocked successfully'
            ]);
        }
        return response()->json([
            'success' => false,
            'message' => 'Could not find contact'
        ]);
    }
    public function unBlockContact(Request $request)
    {
        $allContact = user_contacts::with('user')->where('user_id', auth()->id())->get();
        $contact = $allContact->where('contact_id', $request->contact['id'])->first();
        if ($contact) {
            $contact->update([
                'status' => 'added'
            ]);
            $chat = auth()->user()->chats()->where('type', 'direct')
                ->whereHas('users', function ($query) use ($request) {
                    $query->where('users.id', $request->contact['id']);
                })
                ->first();
            if (!empty($chat)) {
                $chat->update([
                    'status' => 'active'
                ]);
            }
            return response()->json([
                'success' => true,
                'contact' => $contact,
                'message' => 'Unblocked successfully'
            ]);
        }
        return response()->json([
            'success' => false,
            'message' => 'Could not find contact'
        ]);
    }
    public function deleteContact(Request $request)
    {
        $allContacts = auth()->user()->contacts()->get();
        $contact = $allContacts->where('contact_id', $request->contact['id'])->first();
        if ($contact) {
            $userId = $contact->contact_id;
            $userChat = auth()->user()->chats()->where('type', 'direct')
                ->whereHas('users', function ($query) use ($userId) {
                    $query->where('users.id', $userId);
                })
                ->first();
            if (!empty($userChat)) {
                $userChat->update([
                    'status' => 'inactive'
                ]);
            };
            $contact->delete();
            return response()->json([
                'success' => true,
                'message' => 'Contact deleted.'
            ]);
        }
        return response()->json([
            'success' => false,
            'message' => 'Could not find contact.'
        ]);
    }

    public function friendRequests(Request $request)
    {
        $authId = Auth::id();

        $requests = user_contacts::query()
            ->where('contact_id', $authId)
            ->where('status', 'pending')
            ->with('sender')
            ->latest()
            ->paginate(10);

        $data = $requests->getCollection()->map(function ($contact) {
            $user = $contact->sender;
            return [
                'id'        => $contact->id,
                'user_id'   => $user->id,
                'name'      => $user->name,
                'user_name' => $user->user_name,
                'avatar'    => $user->avatar ?? 'avatars/defaultChat.png',
            ];
        });

        return response()->json([
            'data'         => $data,
            'current_page' => $requests->currentPage(),
            'last_page'    => $requests->lastPage(),
            'total'        => $requests->total(),
        ]);
    }
    public function respondFriendRequest(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|integer|exists:user_contacts,id',
            'action'     => 'required|in:accept,reject',
        ]);

        $authId = Auth::id();

        // Security: row sirf tab process ho jab woh row wakayi mujhe (auth user) ko target karti ho
        $contactRow = user_contacts::where('id', $validated['request_id'])
            ->where('contact_id', $authId)
            ->where('status', 'pending')
            ->first();
            $targetId = $contactRow->user_id;

        if (!$contactRow) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found or already handled.',
            ], 404);
        }

        if ($validated['action'] === 'accept') {
            $contactRow->status = 'added';
            $contactRow->save();

            user_contacts::updateOrCreate(
                ['user_id' => $authId, 'contact_id' => $contactRow->user_id],
                ['status' => 'added']
            );
            $userChat = auth()->user()->chats()->where('type', 'direct')
            ->whereHas('users', function ($query) use ($targetId) {
                $query->where('users.id', $targetId);
            })
            ->first();
            if($userChat){
                $userChat->status = 'active';
                $userChat->save();
            }
            return response()->json([
                'success' => true,
                'message' => 'Friend request accepted.',
            ]);
        }

        // reject → row delete
        $contactRow->delete();

        return response()->json([
            'success' => true,
            'message' => 'Friend request rejected.',
        ]);
    }
}
