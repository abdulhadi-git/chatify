<link rel="stylesheet" href="{{ asset('css/navigation.css') }}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

<!-- ============ NAV RAIL (hover to expand) ============ -->
<nav class="nav-rail" id="navRail" aria-label="Main navigation">
  <a href="index.html" class="nav-rail-brand">
    <span class="brand-mark">
      <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z"
          fill="url(#brandGradRail)" />
        <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA" />
        <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA" />
        <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA" />
        <defs>
          <linearGradient id="brandGradRail" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1FC9BE" />
            <stop offset="1" stop-color="#0D7D76" />
          </linearGradient>
        </defs>
      </svg>
    </span>
    <span class="nav-rail-label brand-name-rail">Chatify</span>
  </a>

  <ul class="nav-rail-list">
    <a href="{{ route('show.chats') }}" class="nav-rail-item {{ request()->is('chats*') ? 'active' : '' }}"
      id="navChatLink">
      <span class="nav-icon-wrap">
        <i class="bi bi-chat-dots-fill"></i>
        <span class="nav-dot hidden" id="navChatDot"></span>
      </span>
      <span class="nav-rail-label">Chats</span>
    </a>
    <li>
      <a href="{{ route('discover') }}" class="nav-rail-item {{ request()->is('discover*') ? 'active' : '' }}"
        data-panel="starred">
        <i class="bi bi-search"></i>
        <span class="nav-rail-label">Discover</span>
      </a>
    </li>
    <li>
      <a href="{{ route('show.groups') }}" class="nav-rail-item {{ request()->is('groups*') ? 'active' : '' }}"
        data-panel="calls">
        <i class="bi bi-people-fill"></i>
        <span class="nav-rail-label">Groups</span>
      </a>
    </li>
    <li>
      <a href="{{ route('show.contacts') }}" class="nav-rail-item {{ request()->is('contacts*') ? 'active' : '' }}"
        data-panel="status">
        <i class="bi bi-person-fill"></i>
        <span class="nav-rail-label">Contacts</span>
      </a>
    </li>
  </ul>

  <div class="nav-rail-bottom">
    <a href="{{ route('show.settings') }}" class="nav-rail-item {{ request()->is('settings*') ? 'active' : '' }}" data-panel="settings">
      <i class="bi bi-gear-fill"></i>
      <span class="nav-rail-label">Settings</span>
    </a>
    <a href="{{ route('show.profile') }}" class="nav-rail-item nav-rail-profile {{ request()->is('profile*') ? 'active' : '' }}" data-panel="profile">
      @php
        $avatar = auth()->user()->avatar ?? 'avatars/defaultChat.png';
      @endphp
      <span class="avatar avatar-sm"><img src="{{ asset('storage/' . $avatar) }}" alt="Profile Avatar"></span>
      <span class="nav-rail-label">You</span>
    </a>
  </div>
</nav>

<script>window.AUTH_ID = {{ auth()->id() }}
    window.storageUrl = "{{ asset('storage') }}";
  window.csrfToken = @json(csrf_token());

</script>

@vite(['resources/js/app.js'])