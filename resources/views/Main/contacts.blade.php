<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#14b8ae">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Contacts — Chatify</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/contacts.css') }}">
  {{-- NEW: contacts.css ke baad hi load hona chahiye --}}
  <link rel="stylesheet" href="{{ asset('css/contacts-responsive.css') }}">
</head>

<body class="contacts-body">
  <div class="contacts-app" id="contactsApp">

    @include('Main.partials.navigation')
    {{-- NEW: mobile (<=767px) par hamburger + full-screen navigation --}}
    @include('Main.partials.mobile-navigation')

    <!-- ============ CONTACTS LIST ============ -->
    <aside class="contacts-list-panel">
      <header class="contacts-list-header">
        <h1>Contacts</h1>
        <div class="contacts-list-header-actions">
          <button type="button" class="icon-btn" id="friendRequestsBtn" title="Friend requests"
            aria-label="Friend requests"><i class="bi bi-person-plus"></i></button>
        </div>
      </header>

      <div class="contacts-search">
        <i class="bi bi-search"></i>
        <input type="text" id="contactSearchInput" placeholder="Search contacts" autocomplete="off">
      </div>

      <ul class="contacts-list" id="contactsList">
        @forelse ($contacts as $contact)
          @php
            $user = $contact->user;
            $avatar = $user->avatar ?? 'avatars/defaultChat.png';
          @endphp
          <li class="contact-item" data-bs-id="{{ $user->id }}" data-bs-name="{{ $user->name }}"
            data-bs-username="{{ $user->user_name }}" data-bs-email="{{ $user->email }}"
            data-bs-phone="{{ $user->phone_number ?? 'Not provided' }}" data-bs-bio="{{ $user->bio ?? 'No bio yet.' }}"
            data-bs-status="{{ $contact->status }}" data-bs-avatar="{{ $avatar}}">
            <span class="avatar"><img src="{{ asset('storage/' . $avatar) }}" alt=""></span>
            <div class="contact-item-body">
              <span class="contact-item-name">{{ $user->name }}</span>
              <span class="contact-item-username">{{ '@' . $user->user_name }}</span>
            </div>
            <i class="bi bi-chevron-right contact-item-arrow"></i>
          </li>
        @empty
          <li class="empty-list">No contacts found.</li>
        @endforelse
      </ul>
    </aside>

    <!-- ============ PROFILE PANEL ============ -->
    <main class="contact-main">

      <!-- Empty state, shown before any contact is selected -->
      <div class="contact-empty-state" id="contactEmptyState">
        <div class="contact-empty-icon"><i class="bi bi-person-lines-fill"></i></div>
        <h2>Contact Info</h2>
        <p>Koi contact select karein taake unki profile yahan nazar aaye.</p>
      </div>

      <!-- Active contact profile -->
      <div class="contact-profile" id="contactProfile" hidden>

        <header class="contact-profile-topbar">
          {{-- NEW: desktop par X, mobile par back arrow (CSS decide karti hai) --}}
          <button type="button" class="icon-btn" id="closeProfileBtn" title="Close" aria-label="Close contact info">
            <i class="bi bi-x-lg icon-close"></i>
            <i class="bi bi-arrow-left icon-back"></i>
          </button>
          <span>Contact Info</span>
        </header>

        <div class="contact-profile-hero">
          <span class="avatar avatar-lg" id="profileAvatar"></span>
          <h2 class="contact-profile-name" id="profileName"></h2>
          <span class="contact-profile-username" id="profileUsername"></span>
        </div>

        <div class="contact-profile-actions">
          <button type="button" class="profile-action-btn primary" id="chatBtn">
            <i class="bi bi-chat-dots-fill"></i>
            <span>Chat</span>
          </button>
          <button type="button" class="profile-action-btn" id="blockUnblockBtn">
            <i class="bi "></i>
            <span>-</span>
          </button>
          <button type="button" class="profile-action-btn danger" id="deleteBtn">
            <i class="bi bi-trash3"></i>
            <span>Delete</span>
          </button>
        </div>

        <div class="contact-profile-details">
          <div class="detail-row">
            <i class="bi bi-envelope-fill"></i>
            <div>
              <span class="detail-label">Email</span>
              <span class="detail-value" id="profileEmail"></span>
            </div>
          </div>
          <div class="detail-row">
            <i class="bi bi-telephone-fill"></i>
            <div>
              <span class="detail-label">Phone</span>
              <span class="detail-value" id="profilePhone"></span>
            </div>
          </div>
          <div class="detail-row">
            <i class="bi bi-info-circle-fill"></i>
            <div>
              <span class="detail-label">Bio</span>
              <span class="detail-value" id="profileBio"></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ============ FRIEND REQUESTS MODAL (mobile par bottom sheet) ============ -->
    <div class="modal-overlay" id="friendRequestsOverlay" hidden>
      <div class="friend-requests-modal" role="dialog" aria-modal="true" aria-labelledby="friendRequestsTitle">
        <header class="friend-requests-modal-header">
          <h2 id="friendRequestsTitle">Friend Requests</h2>
          <button type="button" class="icon-btn" id="closeFriendRequestsBtn" title="Close" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <div class="friend-requests-body" id="friendRequestsBody">

          <!-- Initial loading state -->
          <div class="fr-loading" id="friendRequestsLoading">
            <div class="fr-spinner"></div>
            <span>Loading requests...</span>
          </div>

          <!-- Actual list -->
          <ul class="friend-requests-list" id="friendRequestsList" hidden></ul>

          <!-- Empty state -->
          <div class="fr-empty" id="friendRequestsEmpty" hidden>
            <i class="bi bi-person-check"></i>
            <p>No pending friend requests.</p>
          </div>

          <!-- Pagination loading (jab scroll krke agla page load ho) -->
          <div class="fr-loading-more" id="friendRequestsLoadingMore" hidden>
            <div class="fr-spinner fr-spinner-sm"></div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/contacts.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

</body>

</html>