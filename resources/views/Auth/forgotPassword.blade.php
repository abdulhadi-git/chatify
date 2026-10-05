  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Forgot Password — Chatify</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
  </head>
  <body class="auth-body">

  <div class="auth-shell">

    <!-- ============ LEFT: BRAND PANEL ============ -->
    <aside class="auth-panel" aria-hidden="true">
      <a href="index.html" class="brand auth-brand">
        <span class="brand-mark">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z" fill="url(#brandGrad6)"/>
            <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <defs>
              <linearGradient id="brandGrad6" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F4FBFA"/>
                <stop offset="1" stop-color="#CFF4EF"/>
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="brand-name auth-brand-name">Chatify</span>
      </a>

      <div class="auth-panel-copy">
        <h2>Locked out?<br>We'll get you back<br>into your chats.</h2>
        <p>Confirm the email on your account and we'll send over a reset link — it usually arrives in under a minute.</p>
      </div>

      <div class="auth-key-icon" aria-hidden="true">
        <i class="bi bi-key-fill"></i>
      </div>

      <div class="auth-panel-footer">
        <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
        Reset codes expire after 10 minutes for your security.
      </div>
    </aside>

    <!-- ============ RIGHT: FORM PANEL ============ -->
    <main class="auth-form-panel">
      <div class="auth-form-wrap">

        <a href="index.html" class="brand auth-brand-mobile d-lg-none">
          <span class="brand-mark">
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z" fill="url(#brandGrad7)"/>
              <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
              <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA"/>
              <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
              <defs>
                <linearGradient id="brandGrad7" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#1FC9BE"/>
                  <stop offset="1" stop-color="#0D7D76"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span class="brand-name">Chatify</span>
        </a>

        <a href="{{ route('show-sign-in') }}" class="back-link">
          <i class="bi bi-arrow-left" aria-hidden="true"></i> Back to sign in
        </a>

        <!-- ===== STATE 1: request the code ===== -->
        <div id="requestSection">
          <header class="auth-header">
            <h1>Forgot your password?</h1>
            <p>Enter the email on your account and we'll send you a reset instructions.</p>
          </header>

          <form id="forgotPasswordForm" class="auth-form" method="post">
            <div class="field-group">
              <label for="resetEmail">Email address</label>
              <div class="input-wrap">
                <i class="bi bi-envelope input-icon" aria-hidden="true"></i>
                <input type="email" id="resetEmail" name="resetEmail" placeholder="you@example.com" autocomplete="email" required>
              </div>
              <p class="field-error" id="resetEmailError" role="alert"></p>
            </div>

            <button type="submit" class="btn btn-primary-chatify btn-lg-chatify auth-submit" id="sendResetSubmit">
              <span class="btn-label">Confirm</span>
              <span class="btn-spinner" aria-hidden="true"></span>
            </button>
          </form>
        </div>

        <!-- ===== STATE 2: confirmation ===== -->
        <div id="confirmSection" class="confirm-section" hidden>
          <div class="confirm-icon" aria-hidden="true">
            <i class="bi bi-envelope-check-fill"></i>
          </div>
          <h1>Check your email</h1>
          <p class="confirm-text">
            We sent a reset link to <strong id="confirmedEmail">you@example.com</strong>.
            It should arrive within a minute.
          </p>

          <p class="resend-row">
            Didn't get the email?
            <button type="button" class="inline-link-btn" id="resendBtn">Resend</button>
            <span class="resend-timer" id="resendTimer" hidden></span>
          </p>

          <button type="button" class="inline-link-btn change-email-btn" id="changeEmailBtn">
            <i class="bi bi-pencil" aria-hidden="true"></i> Use a different email
          </button>
        </div>

      </div>
    </main>
  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>
  @vite(['resources/js/forgotPassword.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>

  </body>
  </html>