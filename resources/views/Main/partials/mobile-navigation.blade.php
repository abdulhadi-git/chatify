{{--
  resources/views/Main/partials/mobile-navigation.blade.php

  Mobile (<= 767px) navigation: neechay right corner me hamburger button, click par
  poori screen ka menu smoothly (circle reveal) khulta hai. Desktop par kuch show nahi hota
  aur purana .nav-rail wesa hi rehta hai.

  Zaroorat: bootstrap-icons (navigation partial pehle hi load karta hai, isliye isay
  `@include('Main.partials.navigation')` ke BAAD include karein).
--}}
<style>
  .mnav-fab,
  .mnav-overlay { display: none; }

  @media (max-width: 767.98px) {
    /* Desktop rail mobile par chhupa do (DOM me rehta hai taake navChatDot sync ho sake) */
    .nav-rail { display: none !important; }

    html.mnav-lock,
    html.mnav-lock body { overflow: hidden; }

    /* ---------------- Hamburger button (flat, bina glow ke) ---------------- */
    .mnav-fab {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      right: 16px;
      bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      width: 52px;
      height: 52px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: #14b8ae;
      color: #fff;
      box-shadow: none;
      cursor: pointer;
      z-index: 1001;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.25s ease, opacity 0.25s ease, background 0.25s ease, color 0.25s ease;
    }
    .mnav-fab:active { transform: scale(0.94); background: #0d7d76; }
    .mnav-fab:focus-visible { outline: 2px solid #0d7d76; outline-offset: 3px; }

    /* Conversation khuli ho to input bar ke upar overlap na kare — back arrow se list par jayen */
    body.conversation-open .mnav-fab:not(.is-open) {
      opacity: 0;
      transform: scale(0.6);
      pointer-events: none;
    }

    .mnav-fab.is-open {
      background: #e6f7f5;
      color: #0d7d76;
    }

    .mnav-fab-lines {
      position: relative;
      width: 20px;
      height: 14px;
    }
    .mnav-fab-lines span {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      border-radius: 2px;
      background: currentColor;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, top 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mnav-fab-lines span:nth-child(1) { top: 0; }
    .mnav-fab-lines span:nth-child(2) { top: 6px; }
    .mnav-fab-lines span:nth-child(3) { top: 12px; }
    .mnav-fab.is-open .mnav-fab-lines span:nth-child(1) { top: 6px; transform: rotate(45deg); }
    .mnav-fab.is-open .mnav-fab-lines span:nth-child(2) { opacity: 0; }
    .mnav-fab.is-open .mnav-fab-lines span:nth-child(3) { top: 6px; transform: rotate(-45deg); }

    .mnav-fab-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e35d5d;
      border: 2px solid #14b8ae;
    }
    .mnav-fab.is-open .mnav-fab-dot,
    .mnav-fab-dot.hidden { display: none; }

    /* ---------------- Full-screen overlay (light, desktop nav jesa) ---------------- */
    .mnav-overlay {
      --mnav-cx: calc(100% - 42px);
      --mnav-cy: calc(100% - 42px - env(safe-area-inset-bottom, 0px));
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0;
      z-index: 1000;
      padding: calc(18px + env(safe-area-inset-top, 0px)) 18px calc(92px + env(safe-area-inset-bottom, 0px));
      overflow-y: auto;
      overscroll-behavior: contain;
      color: #0f2027;
      background: #ffffff;
      font-family: 'Inter', sans-serif;
      clip-path: circle(0px at var(--mnav-cx) var(--mnav-cy));
      visibility: hidden;
      transition: clip-path 0.5s cubic-bezier(0.76, 0, 0.24, 1), visibility 0s linear 0.5s;
    }
    .mnav-overlay.is-open {
      clip-path: circle(150vmax at var(--mnav-cx) var(--mnav-cy));
      visibility: visible;
      transition: clip-path 0.6s cubic-bezier(0.76, 0, 0.24, 1), visibility 0s linear 0s;
    }

    .mnav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 6px 14px;
      border-bottom: 1px solid #dbe8e6;
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: #0f2027;
      text-decoration: none;
    }

    .mnav-list {
      list-style: none;
      margin: 0;
      padding: 14px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mnav-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 12px;
      color: #45585c;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .mnav-link > i { font-size: 1.15rem; width: 24px; text-align: center; }
    .mnav-link:active { background: #eef6f5; color: #0d7d76; }
    .mnav-link:focus-visible { outline: 2px solid #14b8ae; outline-offset: 2px; }
    .mnav-link.active {
      background: #e6f7f5;
      color: #0d7d76;
      font-weight: 600;
    }
    .mnav-icon-wrap { position: relative; display: inline-flex; }
    .mnav-dot {
      position: absolute;
      top: -2px;
      right: -4px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #e35d5d;
      border: 2px solid #ffffff;
    }
    .mnav-dot.hidden { display: none; }

    .mnav-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: auto;
      /* right side par hamburger button hai */
      margin-right: 66px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #f4faf9;
      border: 1px solid #dbe8e6;
      color: #0f2027;
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 600;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .mnav-profile:active { background: #eef6f5; }
    .mnav-profile.active { background: #e6f7f5; color: #0d7d76; border-color: #e6f7f5; }
    .mnav-profile img {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .mnav-profile small {
      display: block;
      font-weight: 400;
      font-size: 0.75rem;
      color: #6b8280;
    }

    /* Mouse/trackpad wali screens (tablet + mouse) par desktop jesa hover */
    @media (hover: hover) {
      .mnav-link:hover { background: #eef6f5; color: #0d7d76; }
      .mnav-link.active:hover { background: #e6f7f5; }
      .mnav-profile:hover { background: #eef6f5; }
      .mnav-fab:hover { background: #0d7d76; }
      .mnav-fab.is-open:hover { background: #e6f7f5; }
    }

    /* Items thori der baad ek ek kar ke aate hain (sirf open par) */
    .mnav-item {
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .mnav-overlay.is-open .mnav-item {
      opacity: 1;
      transform: none;
      transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      transition-delay: calc(0.15s + var(--i, 0) * 0.04s);
    }
  }

  @media (max-width: 767.98px) and (prefers-reduced-motion: reduce) {
    .mnav-overlay,
    .mnav-overlay.is-open { clip-path: none; opacity: 0; transition: opacity 0.2s ease, visibility 0s linear 0.2s; }
    .mnav-overlay.is-open { opacity: 1; transition: opacity 0.2s ease, visibility 0s; }
    .mnav-item,
    .mnav-overlay.is-open .mnav-item { transition: none; transform: none; opacity: 1; }
    .mnav-fab-lines span { transition: none; }
  }
</style>

<button type="button" class="mnav-fab" id="mnavFab" aria-label="Open menu" aria-expanded="false" aria-controls="mnavOverlay">
  <span class="mnav-fab-lines" aria-hidden="true"><span></span><span></span><span></span></span>
  <span class="mnav-fab-dot mnav-dot-sync hidden" aria-hidden="true"></span>
</button>

<div class="mnav-overlay" id="mnavOverlay" role="dialog" aria-modal="true" aria-label="Main navigation" aria-hidden="true">
  <a href="{{ route('show.chats') }}" class="mnav-brand mnav-item" style="--i:0">
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z"
        fill="url(#brandGradMobile)" />
      <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA" />
      <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA" />
      <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA" />
      <defs>
        <linearGradient id="brandGradMobile" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1FC9BE" />
          <stop offset="1" stop-color="#0D7D76" />
        </linearGradient>
      </defs>
    </svg>
    <span>Chatify</span>
  </a>

  <ul class="mnav-list">
    <li class="mnav-item" style="--i:1">
      <a href="{{ route('show.chats') }}" class="mnav-link {{ request()->is('chats*') ? 'active' : '' }}">
        <span class="mnav-icon-wrap">
          <i class="bi bi-chat-dots-fill"></i>
          <span class="mnav-dot mnav-dot-sync hidden"></span>
        </span>
        <span>Chats</span>
      </a>
    </li>
    <li class="mnav-item" style="--i:2">
      <a href="{{ route('discover') }}" class="mnav-link {{ request()->is('discover*') ? 'active' : '' }}">
        <i class="bi bi-search"></i><span>Discover</span>
      </a>
    </li>
    <li class="mnav-item" style="--i:3">
      <a href="{{ route('show.groups') }}" class="mnav-link {{ request()->is('groups*') ? 'active' : '' }}">
        <i class="bi bi-people-fill"></i><span>Groups</span>
      </a>
    </li>
    <li class="mnav-item" style="--i:4">
      <a href="{{ route('show.contacts') }}" class="mnav-link {{ request()->is('contacts*') ? 'active' : '' }}">
        <i class="bi bi-person-fill"></i><span>Contacts</span>
      </a>
    </li>
    <li class="mnav-item" style="--i:5">
      <a href="{{ route('show.settings') }}" class="mnav-link {{ request()->is('settings*') ? 'active' : '' }}">
        <i class="bi bi-gear-fill"></i><span>Settings</span>
      </a>
    </li>
  </ul>

  @php
    $mnavAvatar = auth()->user()->avatar ?? 'avatars/defaultChat.png';
  @endphp
  <a href="{{ route('show.profile') }}" class="mnav-profile mnav-item {{ request()->is('profile*') ? 'active' : '' }}" style="--i:6">
    <img src="{{ asset('storage/' . $mnavAvatar) }}" alt="">
    <span>
      {{ auth()->user()->name }}
      <small>View profile</small>
    </span>
  </a>
</div>

<script>
  (function () {
    var fab = document.getElementById('mnavFab');
    var overlay = document.getElementById('mnavOverlay');
    if (!fab || !overlay) return;

    var root = document.documentElement;
    var mq = window.matchMedia('(max-width: 767.98px)');
    var links = overlay.querySelectorAll('a[href]');

    function isOpen() { return overlay.classList.contains('is-open'); }

    function openMenu() {
      overlay.classList.add('is-open');
      fab.classList.add('is-open');
      fab.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-label', 'Close menu');
      overlay.setAttribute('aria-hidden', 'false');
      root.classList.add('mnav-lock');
      var active = overlay.querySelector('.mnav-link.active') || links[0];
      setTimeout(function () { if (active && isOpen()) active.focus({ preventScroll: true }); }, 350);
    }

    function closeMenu(returnFocus) {
      if (!isOpen()) return;
      overlay.classList.remove('is-open');
      fab.classList.remove('is-open');
      fab.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-label', 'Open menu');
      overlay.setAttribute('aria-hidden', 'true');
      root.classList.remove('mnav-lock');
      if (returnFocus) fab.focus({ preventScroll: true });
    }

    fab.addEventListener('click', function () { isOpen() ? closeMenu(false) : openMenu(); });

    // Link par click -> menu band (page navigate ho jata hai, "#" wale link par bhi band ho)
    overlay.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      if (a.getAttribute('href') === '#') e.preventDefault();
      closeMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { closeMenu(true); return; }
      if (e.key === 'Tab') {
        // Focus menu ke andar hi ghoomta rahe
        var items = Array.prototype.slice.call(links).concat([fab]);
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Desktop size par jaate hi menu band
    var onMq = function () { if (!mq.matches) closeMenu(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);

    // Back/forward cache se wapas aayen to menu khula na ho
    window.addEventListener('pageshow', function () { closeMenu(false); });

    // Desktop rail ke #navChatDot ki state yahan ke dots par mirror karo
    var src = document.getElementById('navChatDot');
    var mirrors = document.querySelectorAll('.mnav-dot-sync');
    if (src && mirrors.length) {
      var sync = function () {
        var hide = src.classList.contains('hidden') || src.hidden || getComputedStyle(src).display === 'none';
        mirrors.forEach(function (d) { d.classList.toggle('hidden', hide); });
      };
      sync();
      new MutationObserver(sync).observe(src, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    }
  })();
</script>