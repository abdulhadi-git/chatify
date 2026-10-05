<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>Profile — Chatify</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

<link rel="stylesheet" href="{{ asset('css/style.css') }}">
<link rel="stylesheet" href="{{ asset('css/contacts.css') }}">
<link rel="stylesheet" href="{{ asset('css/profile.css') }}">
</head>
<body class="profile-body">
<div class="profile-app" id="profileApp">

  @include('Main.partials.navigation')
  {{-- NEW: mobile (<=767px) par hamburger + full-screen navigation --}}
  @include('Main.partials.mobile-navigation')

  <main class="profile-main">
    <div class="profile-wrap">

      <h1 class="profile-title">Your profile</h1>
      <p class="profile-sub">Update how you appear to the people you talk to.</p>

      <form class="profile-card" id="profileForm" method="POST" enctype="multipart/form-data" novalidate>
        @csrf
        @php
            $avatar = $user->avatar ?? 'avatars/defaultChat.png';
        @endphp
        <section class="photo-section">
          <div class="avatar-xl" id="avatarPreview">
            <img id="avatarImg" alt="Profile photo"
                 src="{{ asset('storage/' . $avatar) }}"
                 data-default="{{ asset('storage/avatars/defaultChat.png') }}">
          </div>

          <div class="photo-actions">
            <input type="file" id="photoInput" name="photo" accept="image/png,image/jpeg,image/webp" hidden>
            <input type="hidden" name="remove_photo" id="removePhoto" value="0">

            <button type="button" class="btn btn-outline-chatify btn-sm-chatify" id="changePhotoBtn">
              <i class="bi bi-camera-fill" aria-hidden="true"></i> Change photo
            </button>
            <button type="button" class="btn btn-danger-chatify btn-sm-chatify" id="removePhotoBtn" @unless($user->avatar && $user->avatar !== 'avatars/defaultChat.png') hidden @endunless>
              <i class="bi bi-trash3" aria-hidden="true"></i> Remove photo
            </button>
            <p class="field-hint">JPG, PNG or WebP. Max 2 MB.</p>
          </div>
        </section>

        <div class="field-grid">
          <div class="field">
            <label for="name">Full name</label>
            <input type="text" id="name" name="name" value="{{ $user->name }}" maxlength="60" autocomplete="name" required>
            <span class="field-error" data-for="name"></span>
          </div>

          <div class="field">
            <label for="username">Username</label>
            <div class="input-prefix">
              <span aria-hidden="true">@</span>
              <input type="text" id="username" name="user_name" value="{{ $user->user_name }}" maxlength="30" autocomplete="username" required>
            </div>
            <span class="field-hint">Letters, numbers, dots and underscores only.</span>
            <span class="field-error" data-for="username"></span>
          </div>

          <div class="field field-full">
            <label for="bio">Bio</label>
            <textarea id="bio" name="bio" rows="3" maxlength="160" placeholder="Tell people a little about yourself">{{ $user->bio }}</textarea>
            <span class="field-hint counter"><span id="bioCount">0</span>/160</span>
          </div>

          <div class="field">
            <label for="phone">Phone number</label>
            <input type="tel" id="phone" name="phone_number" value="{{ $user->phone_number }}" autocomplete="tel" inputmode="tel">
            <span class="field-error" data-for="phone"></span>
          </div>

          <div class="field">
            <label for="email">Email <i class="bi bi-lock-fill lock-icon" aria-hidden="true"></i></label>
            <input type="email" id="email" value="{{ $user->email }}" readonly aria-describedby="emailHint">
            <span class="field-hint" id="emailHint">Email can't be changed.</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="reset" class="btn btn-outline-chatify" id="discardBtn" disabled>Discard changes</button>
          <button type="submit" class="btn btn-primary-chatify" id="saveBtn" disabled>Save changes</button>
        </div>
      </form>

    </div>
  </main>
</div>

<div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

@vite(['resources/js/profile.js'])
</body>
</html>