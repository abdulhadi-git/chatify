<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#14b8ae">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Groups — Chatify</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/groups.css') }}">
  {{-- NEW: groups.css ke baad hi load hona chahiye --}}
  <link rel="stylesheet" href="{{ asset('css/groups-responsive.css') }}">
</head>

<body class="groups-body">
  <div class="groups-app" id="groupsApp">
    @include('Main.partials.navigation')
    {{-- NEW: mobile (<=767px) par hamburger + full-screen navigation --}}
    @include('Main.partials.mobile-navigation')

    <!-- ============ GROUP LIST ============ -->
    <aside class="group-list-panel">
      <header class="group-list-header">
        <h1>Groups</h1>
        <div class="group-list-header-actions">
          <button type="button" class="icon-btn" title="New group"><i class="bi bi-plus-lg"></i></button>
        </div>
      </header>

      <div class="group-search">
        <i class="bi bi-search"></i>
        <input type="text" id="groupSearchInput" placeholder="Search groups" autocomplete="off">
      </div>

      <ul class="group-list" id="groupList">
        @forelse ($authUser->groups as $group)
          @php
            $membersCount = $group->users->count();
            $isOwner = (int) $group->created_by === (int) auth()->id();
            $avatar = $group->avatar ?? 'avatars/defaultGroup.png';
          @endphp
          <li class="group-item {{ isset($chat_hash) && $group->chat_hash === $chat_hash ? 'active' : '' }}"
            data-group-id="{{ $group->id }}" data-group-hash="{{ $group->chat_hash }}" data-name="{{ $group->title }}"
            data-avatar="{{ asset('storage/' . $avatar) }}" data-created-by="{{ $group->created_by }}"
            data-members-count="{{ $membersCount }}">
            <span class="avatar">
              <img src="{{ asset('storage/' . $avatar) }}" alt="{{ $group->name }}">
            </span>
            <div class="group-item-body">
              <div class="group-item-row">
                <span class="group-item-name">{{ $group->title }}</span>
                @if ($isOwner)
                  <span class="group-item-meta"><i class="bi bi-star-fill"
                      style="color:#e8b431;font-size:.72rem;"></i></span>
                @endif
              </div>
              <div class="group-item-row">
                <span class="group-item-sub">{{ $membersCount }} members</span>
              </div>
            </div>
          </li>
        @empty
          <li class="group-empty-list">No groups found.</li>
        @endforelse
      </ul>
    </aside>

    <!-- ============ GROUP PROFILE (right) ============ -->
    <main class="group-main">

      {{-- NEW: sirf mobile par nazar aata hai --}}
      <header class="group-mobile-topbar">
        <button type="button" class="group-back-btn" id="groupBackBtn" aria-label="Back to groups">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="group-mobile-title">Group Info</span>
      </header>

      <!-- Empty state, shown before any group is selected -->
      <div class="group-empty-state" id="groupEmptyState">
        <div class="group-empty-icon"><i class="bi bi-people-fill"></i></div>
        <h2>Group Profile</h2>
        <p>Select a group to view its profile and members.</p>
      </div>

      <!-- Loading state -->
      <div class="group-loading" id="groupLoading" hidden>
        <div class="group-loading-dots"><span></span><span></span><span></span></div>
      </div>

      <!-- Group profile content, injected/rebuilt by groups.js -->
      <div class="group-profile" id="groupProfile" hidden></div>

    </main>

  </div>

  <!-- ============ CREATE GROUP MODAL ============ -->
  <div class="cg-overlay" id="cgOverlay" hidden>
    <div class="cg-modal" role="dialog" aria-modal="true" aria-labelledby="cgHeading">

      <header class="cg-header">
        <button type="button" class="icon-btn" id="cgBack" aria-label="Back" hidden><i
            class="bi bi-arrow-left"></i></button>
        <h3 id="cgHeading">New group</h3>
        <button type="button" class="icon-btn" id="cgClose" aria-label="Close"><i class="bi bi-x-lg"></i></button>
      </header>

      <!-- STEP 1: details -->
      <div class="cg-step" id="cgStepDetails">
        <div class="cg-avatar-picker">
          <button type="button" class="cg-avatar-btn" id="cgAvatarBtn" aria-label="Upload group avatar">
            <img id="cgAvatarPreview" src="{{ asset('storage/avatars/defaultGroup.png') }}" alt="">
            <span class="cg-avatar-cam"><i class="bi bi-camera-fill"></i></span>
          </button>
          <input type="file" id="cgAvatarInput" accept="image/*" hidden>
        </div>

        <label class="cg-label" for="cgTitleInput">Group title</label>
        <input type="text" id="cgTitleInput" class="cg-input" maxlength="60" placeholder="e.g. Frontend Team"
          autocomplete="off">

        <button type="button" class="cg-select-btn" id="cgSelectBtn">
          <i class="bi bi-person-plus-fill"></i>
          <span>Select members</span>
          <span class="cg-selected-count" id="cgSelectedCount">0</span>
          <i class="bi bi-chevron-right"></i>
        </button>

        <p class="cg-error" id="cgError" hidden></p>
      </div>

      <!-- STEP 2: contacts (15 per page) -->
      <div class="cg-step cg-step-contacts" id="cgStepContacts" hidden>
        <ul class="cg-contact-list" id="cgContactList"></ul>
        <div class="cg-contacts-status" id="cgContactsStatus"></div>
        <button type="button" class="cg-load-more" id="cgLoadMore" hidden>Load more</button>
      </div>

      <footer class="cg-footer">
        <button type="button" class="cg-btn cg-btn-ghost" id="cgCancel">Cancel</button>
        <button type="button" class="cg-btn cg-btn-primary" id="cgCreateBtn">Create group</button>
      </footer>
    </div>
  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/groups.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</body>

</html>