<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#14b8ae">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Discover — Chatify</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/discover.css') }}">
  {{-- NEW: discover.css ke baad hi load hona chahiye --}}
  <link rel="stylesheet" href="{{ asset('css/discover-responsive.css') }}">
</head>

<body class="discover-body">
  <div class="discover-app" id="discoverApp">

    @include('Main.partials.navigation')
    {{-- NEW: mobile (<=767px) par hamburger + full-screen navigation --}}
    @include('Main.partials.mobile-navigation')

    <!-- ============ SEARCH + RESULTS ============ -->
    <aside class="discover-list-panel">
      <header class="discover-list-header">
        <h1>Discover</h1>
      </header>

      <div class="discover-search" id="discoverSearchWrap">
        <i class="bi bi-search"></i>
        <input type="text" id="discoverSearchInput" placeholder="Search by name or username" autocomplete="off">
        <span class="search-spinner"></span>
      </div>

      <ul class="discover-results" id="discoverResults">
        <li class="discover-hint">Type a name or username to start discovering people.</li>
      </ul>
    </aside>

    <!-- ============ PROFILE (right) ============ -->
    <main class="discover-main">

      {{-- NEW: sirf mobile par nazar aata hai --}}
      <header class="discover-mobile-topbar">
        <button type="button" class="discover-back-btn" id="discoverBackBtn" aria-label="Back to results">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="discover-mobile-title">Profile</span>
      </header>

      <!-- Empty state, shown before any user is selected -->
      <div class="discover-empty-state" id="discoverEmptyState">
        <div class="discover-empty-icon"><i class="bi bi-person-badge-fill"></i></div>
        <h2>User Profile</h2>
        <p>Search and select someone from the left panel to view their profile.</p>
      </div>

      <!-- Loading state -->
      <div class="discover-profile-loading" id="discoverProfileLoading" hidden>
        <div class="discover-loading-dots"><span></span><span></span><span></span></div>
      </div>

      <!-- Profile content, injected/rebuilt by discover.js -->
      <div class="discover-profile" id="discoverProfile" hidden></div>

    </main>

  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/discover.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</body>

</html>