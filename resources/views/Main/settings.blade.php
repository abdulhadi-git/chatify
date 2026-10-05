<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#14b8ae">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Settings — Chatify</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/settings.css') }}">
</head>

<body class="settings-body">
  <div class="settings-app" id="settingsApp">
    @include('Main.partials.navigation')
    {{-- mobile (<=767px) par hamburger + full-screen navigation --}}
    @include('Main.partials.mobile-navigation')

    <!-- ============ SETTINGS MENU (left) ============ -->
    <aside class="settings-list-panel">
      <header class="settings-list-header">
        <h1>Settings</h1>
      </header>

      <ul class="settings-menu" id="settingsMenu">
        <li class="settings-menu-item active" data-section="account" data-title="Account">
          <span class="settings-menu-icon"><i class="bi bi-person-fill"></i></span>
          <div class="settings-menu-body">
            <span class="settings-menu-name">Account</span>
            <span class="settings-menu-sub">Password and logout</span>
          </div>
          <i class="bi bi-chevron-right settings-menu-chevron"></i>
        </li>
        <li class="settings-menu-item" data-section="blocked" data-title="Blocked users">
          <span class="settings-menu-icon"><i class="bi bi-slash-circle-fill"></i></span>
          <div class="settings-menu-body">
            <span class="settings-menu-name">Blocked users</span>
            <span class="settings-menu-sub">People you have blocked</span>
          </div>
          <i class="bi bi-chevron-right settings-menu-chevron"></i>
        </li>
        <li class="settings-menu-item" data-section="more" data-title="More settings">
          <span class="settings-menu-icon"><i class="bi bi-sliders"></i></span>
          <div class="settings-menu-body">
            <span class="settings-menu-name">More settings</span>
            <span class="settings-menu-sub">Sounds and preferences</span>
          </div>
          <i class="bi bi-chevron-right settings-menu-chevron"></i>
        </li>
      </ul>
    </aside>

    <!-- ============ SETTINGS DETAIL (right) ============ -->
    <main class="settings-main">

      {{-- sirf mobile par nazar aata hai --}}
      <header class="settings-mobile-topbar">
        <button type="button" class="settings-back-btn" id="settingsBackBtn" aria-label="Back to settings">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="settings-mobile-title" id="settingsMobileTitle">Settings</span>
      </header>

      <div class="settings-content">

        <!-- ---------- ACCOUNT ---------- -->
        <section class="settings-section active" id="section-account" data-section="account">
          <div class="settings-section-head">
            <span class="settings-section-icon"><i class="bi bi-person-fill"></i></span>
            <div>
              <h2 class="settings-section-heading">Account</h2>
              <p class="settings-section-sub">Manage your password and sign out of this device.</p>
            </div>
          </div>

          @php
            $me = auth()->user();
            $meAvatar = $me->avatar ?? 'avatars/defaultChat.png';
          @endphp
          <div class="settings-card account-summary">
            <div class="account-avatar">
              <img src="{{ asset('storage/' . $meAvatar) }}" alt="{{ $me->name }}">
            </div>
            <div class="account-info">
              <span class="account-name">{{ $me->name }}</span>
              <span class="account-meta">{{ '@' . $me->user_name }}</span>
              <span class="account-meta">{{ $me->email }}</span>
            </div>
            {{-- Apne profile page ka route yahan lagayein --}}
            <a class="st-btn-outline-chatify st-btn-sm" href="{{ url('/profile') }}">
              <i class="bi bi-pencil-fill"></i> Edit profile
            </a>
          </div>

          <div class="settings-card">
            <div class="st-card-head">
              <span class="st-card-icon"><i class="bi bi-shield-lock-fill"></i></span>
              <div class="st-card-head-text">
                <h3 class="st-card-title">Change password</h3>
                <p class="st-card-desc">Choose a password you don't use on any other site.</p>
              </div>
            </div>

            <form id="passwordForm" novalidate>
              <div class="st-card-body">
                <div class="st-field">
                  <label for="currentPassword">Current password</label>
                  <div class="st-input-wrap">
                    <input type="password" id="currentPassword" name="current_password" autocomplete="current-password">
                    <button type="button" class="st-pw-toggle" aria-label="Show password"><i class="bi bi-eye"></i></button>
                  </div>
                  <span class="st-field-error" data-for="current_password"></span>
                </div>

                <div class="st-field-row">
                  <div class="st-field">
                    <label for="newPassword">New password</label>
                    <div class="st-input-wrap">
                      <input type="password" id="newPassword" name="password" autocomplete="new-password">
                      <button type="button" class="st-pw-toggle" aria-label="Show password"><i class="bi bi-eye"></i></button>
                    </div>
                    <span class="st-field-hint">At least 8 characters.</span>
                    <span class="st-field-error" data-for="password"></span>
                  </div>

                  <div class="st-field">
                    <label for="confirmPassword">Confirm new password</label>
                    <div class="st-input-wrap">
                      <input type="password" id="confirmPassword" name="password_confirmation" autocomplete="new-password">
                      <button type="button" class="st-pw-toggle" aria-label="Show password"><i class="bi bi-eye"></i></button>
                    </div>
                    <span class="st-field-error" data-for="password_confirmation"></span>
                  </div>
                </div>
              </div>

              <div class="st-card-foot">
                <button type="submit" class="st-btn-primary-chatify" id="passwordSaveBtn">Update password</button>
              </div>
            </form>
          </div>

          <div class="settings-card st-action-card">
            <span class="st-card-icon"><i class="bi bi-box-arrow-right"></i></span>
            <div class="st-card-head-text">
              <h3 class="st-card-title">Log out</h3>
              <p class="st-card-desc">You will need to sign in again on this device.</p>
            </div>
            <button type="button" class="st-btn-outline-chatify st-is-danger" id="logoutBtn">Log out</button>
          </div>
        </section>

        <!-- ---------- BLOCKED USERS ---------- -->
        <section class="settings-section" id="section-blocked" data-section="blocked">
          <div class="settings-section-head">
            <span class="settings-section-icon"><i class="bi bi-slash-circle-fill"></i></span>
            <div>
              <h2 class="settings-section-heading">Blocked users</h2>
              <p class="settings-section-sub">Blocked people can't message you. Unblock them any time.</p>
            </div>
          </div>

          <div class="settings-card">
            <div class="st-card-head st-card-head-split">
              <div class="st-card-head-main">
                <span class="st-card-icon"><i class="bi bi-people-fill"></i></span>
                <h3 class="st-card-title">Blocked contacts</h3>
              </div>
              <span class="st-count-badge" id="blockedCount" hidden>0</span>
            </div>

            <div class="blocked-loading" id="blockedLoading" hidden>
              <div class="st-group-loading-dots"><span></span><span></span><span></span></div>
            </div>

            <ul class="blocked-list" id="blockedList"></ul>

            <div class="blocked-more" id="blockedMoreWrap" hidden>
              <button type="button" class="st-btn-outline-chatify st-btn-sm" id="blockedMoreBtn">Load more</button>
            </div>

            <div class="blocked-empty" id="blockedEmpty" hidden>
              <div class="blocked-empty-icon"><i class="bi bi-check2-circle"></i></div>
              <h4>No blocked users</h4>
              <p>When you block someone, they will show up here.</p>
            </div>
          </div>
        </section>

        <!-- ---------- MORE SETTINGS ---------- -->
        <section class="settings-section" id="section-more" data-section="more">
          <div class="settings-section-head">
            <span class="settings-section-icon"><i class="bi bi-sliders"></i></span>
            <div>
              <h2 class="settings-section-heading">More settings</h2>
              <p class="settings-section-sub">Sounds and preferences. These are saved in this browser only.</p>
            </div>
          </div>

          <div class="settings-card">
            <div class="st-card-head st-card-head-split">
              <div class="st-card-head-main">
                <span class="st-card-icon"><i class="bi bi-volume-up-fill"></i></span>
                <div class="st-card-head-text">
                  <h3 class="st-card-title">Sounds</h3>
                  <p class="st-card-desc">Choose when Chatify plays a sound.</p>
                </div>
              </div>
            </div>

            {{-- Har toggle ka data-pref localStorage ki key hai. Naya toggle: bas ek row copy karein
                 aur settings.js ke PREFS me us key ka default likh dein. --}}
            <ul class="st-toggle-list">
              <li class="st-toggle-row">
                <div class="st-toggle-text">
                  <span class="st-toggle-title">Play sound on new message</span>
                  <span class="st-toggle-desc">A short sound when someone sends you a message.</span>
                </div>
                <label class="st-switch" aria-label="Play sound on new message">
                  <input type="checkbox" data-pref="messageSound">
                  <span class="st-switch-slider"></span>
                </label>
              </li>

              <li class="st-toggle-row">
                <div class="st-toggle-text">
                  <span class="st-toggle-title">Sound in the open chat</span>
                  <span class="st-toggle-desc">Also play the sound for the chat you are currently viewing.</span>
                </div>
                <label class="st-switch" aria-label="Sound in the open chat">
                  <input type="checkbox" data-pref="soundInActiveChat">
                  <span class="st-switch-slider"></span>
                </label>
              </li>
            </ul>
          </div>
        </section>

      </div>
    </main>
  </div>

  @vite(['resources/js/settings.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</body>

</html>