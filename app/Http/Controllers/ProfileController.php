<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function showProfile()
    {
        $user = auth()->user();
        return view('Main.profile', compact('user'));
    }

public function updateProfile(Request $request)
{
    $request->validate([
        'name'         => 'required|string|min:2|max:60',
        'user_name'    => 'required|string|max:30|unique:users,user_name,' . auth()->id(),
        'bio'          => 'nullable|string|max:160',
        'phone_number' => 'nullable|string|max:20',
        'photo'        => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
    ]);

    $user    = auth()->user();
    $default = 'avatars/defaultChat.png';

    $data = [
        'name'         => $request->name,
        'user_name'    => $request->user_name,
        'bio'          => $request->bio,
        'phone_number' => $request->phone_number,
    ];

    $hasCustomAvatar = $user->avatar && $user->avatar !== $default;

    if ($request->hasFile('photo')) {
        // Nayi photo: purani delete karo, nayi store karo
        if ($hasCustomAvatar) {
            Storage::disk('public')->delete($user->avatar);
        }
        $data['avatar'] = $request->file('photo')->store('avatars', 'public');

    } elseif ($request->input('remove_photo') == '1') {
        // Photo hatao: purani file delete karo, default par wapas
        if ($hasCustomAvatar) {
            Storage::disk('public')->delete($user->avatar);
        }
        $data['avatar'] = $default;

    } elseif (empty($user->avatar)) {
        // Purana null/khali avatar ho to default set kar do
        $data['avatar'] = $default;
    }

    $user->update($data);

    return response()->json([
        'message'    => 'Profile saved.',
        'avatar_url' => asset('storage/' . ($user->avatar ?: $default)),
    ]);
}
}
