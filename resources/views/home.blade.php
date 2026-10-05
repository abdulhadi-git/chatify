<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chatify — Connect. Chat. Communicate.</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

<link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>

<div class="noise-overlay" aria-hidden="true"></div>

<!-- ============ HEADER ============ -->
<header class="site-header">
  <div class="header-inner">
    <a href="#" class="brand" aria-label="Chatify home">
      <span class="brand-mark" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z" fill="url(#brandGrad)"/>
          <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <defs>
            <linearGradient id="brandGrad" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stop-color="#1FC9BE"/>
              <stop offset="1" stop-color="#0D7D76"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span class="brand-name">Chatify</span>
    </a>

    <nav class="header-actions">
      <button class="btn btn-link header-signin d-none d-sm-inline-flex" id="headerSignInBtn" type="button">Sign in</button>
      <button class="btn btn-primary-chatify header-cta" id="headerCreateBtn" type="button">Create account</button>
    </nav>
  </div>
</header>

<!-- ============ HERO ============ -->
<main>
  <section class="hero" id="hero">
    <div class="hero-inner">

      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>Real-time messaging, built for focus</p>

        <h1 class="headline">
          Connect. Chat.
          <span class="headline-accent">Communicate.</span>
        </h1>

        <p class="subhead">
          Chatify brings your conversations, calls, and groups into one fast,
          uncluttered space — built for the way people actually talk to each other.
        </p>

        <div class="cta-row">
          <button class="btn btn-primary-chatify btn-lg-chatify" id="signInBtn" type="button">
            Sign in
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
          <button class="btn btn-outline-chatify btn-lg-chatify" id="createAccountBtn" type="button">
            Create account
          </button>
        </div>

        <p class="microcopy">
          <i class="bi bi-shield-check" aria-hidden="true"></i>
          No spam, no clutter — just the people you actually talk to.
        </p>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="visual-backdrop"></div>

        <div class="chat-stack">

          <div class="bubble-row incoming stack-item" style="--delay:0">
            <span class="avatar" data-initials="AK">AK</span>
            <div class="bubble bubble-in">
              <p>Hey! Are we still on for tomorrow?</p>
              <span class="bubble-time">12:20 PM</span>
            </div>
          </div>

          <div class="bubble-row outgoing stack-item" style="--delay:1">
            <div class="bubble bubble-out">
              <p>Yes! See you at 6 <span aria-hidden="true">😊</span></p>
              <span class="bubble-time">12:21 PM <i class="bi bi-check2-all" aria-hidden="true"></i></span>
            </div>
          </div>

          <div class="bubble-row incoming stack-item" style="--delay:2">
            <span class="avatar" data-initials="AK">AK</span>
            <div class="bubble bubble-in bubble-typing" id="typingBubble">
              <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>
          </div>

        </div>

        <div class="floating-chip chip-call">
          <i class="bi bi-telephone-fill" aria-hidden="true"></i>
        </div>
        <div class="floating-chip chip-online">
          <span class="dot-online" aria-hidden="true"></span>
          Online
        </div>
      </div>

    </div>

    <div class="hero-scroll-cue" aria-hidden="true">
      <span></span>
    </div>
  </section>

  <!-- ============ TRUST / FEATURE STRIP ============ -->
  <section class="feature-strip" aria-label="What Chatify offers">
    <div class="feature-strip-inner">

      <article class="feature-card">
        <div class="feature-icon"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i></div>
        <h3>Instant delivery</h3>
        <p>Messages, ticks, and typing indicators update the moment they happen — no refreshing, no waiting.</p>
      </article>

      <article class="feature-card">
        <div class="feature-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></div>
        <h3>Groups that scale</h3>
        <p>From a two-person thread to a hundred-member community, group chat stays fast and organized.</p>
      </article>

      <article class="feature-card">
        <div class="feature-icon"><i class="bi bi-camera-video-fill" aria-hidden="true"></i></div>
        <h3>Calls, built in</h3>
        <p>Jump from a chat straight into a voice or video call without switching apps.</p>
      </article>

      <article class="feature-card">
        <div class="feature-icon"><i class="bi bi-lock-fill" aria-hidden="true"></i></div>
        <h3>Your data, your rules</h3>
        <p>Control who sees your last seen, your read receipts, and your online status.</p>
      </article>

    </div>
  </section>
</main>

<!-- ============ FOOTER ============ -->
<footer class="site-footer">
  <div class="footer-inner">
    <span class="footer-brand">Chatify</span>
    <span class="footer-copy">&copy; <span id="year"></span> Chatify. All rights reserved.</span>
  </div>
</footer>

<!-- ============ TOAST (frontend-only feedback) ============ -->
<div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

@vite(['resources/js/script.js'])
</body>
</html>
