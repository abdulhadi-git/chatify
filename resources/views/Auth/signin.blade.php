<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Sign In — Chatify</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">

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
            <path
              d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z"
              fill="url(#brandGrad2)" />
            <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA" />
            <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA" />
            <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA" />
            <defs>
              <linearGradient id="brandGrad2" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F4FBFA" />
                <stop offset="1" stop-color="#CFF4EF" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="brand-name auth-brand-name">Chatify</span>
      </a>

      <div class="auth-panel-copy">
        <h2>Your conversations,<br>picked up right where<br>you left them.</h2>
        <p>Sign in to see new messages, calls, and group activity waiting for you.</p>
      </div>

      <!-- Mini conversation preview — reuses the chat-bubble visual language -->
      <div class="auth-preview-stack">
        <div class="bubble-row incoming stack-item" style="--delay:0">
          <span class="avatar" data-initials="SR">SR</span>
          <div class="bubble bubble-in">
            <p>Sent you the files 📎</p>
            <span class="bubble-time">9:14 AM</span>
          </div>
        </div>
        <div class="bubble-row outgoing stack-item" style="--delay:1">
          <div class="bubble bubble-out">
            <p>Got them, thank you!</p>
            <span class="bubble-time">9:16 AM <i class="bi bi-check2-all"></i></span>
          </div>
        </div>
      </div>

      <div class="auth-panel-footer">
        <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
        Your account is protected. We'll never share your details.
      </div>
    </aside>

    <!-- ============ RIGHT: FORM PANEL ============ -->
    <main class="auth-form-panel">
      <div class="auth-form-wrap">

        <a href="index.html" class="brand auth-brand-mobile d-lg-none">
          <span class="brand-mark">
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z"
                fill="url(#brandGrad3)" />
              <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA" />
              <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA" />
              <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA" />
              <defs>
                <linearGradient id="brandGrad3" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#1FC9BE" />
                  <stop offset="1" stop-color="#0D7D76" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span class="brand-name">Chatify</span>
        </a>

        <header class="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue to your conversations.</p>
        </header>

        <form id="signInForm" class="auth-form" method="post" action="{{ route('login') }}">
          @csrf
          <div class="field-group">
            <label for="identifier">Email or username</label>
            <div class="input-wrap">
              <i class="bi bi-person input-icon" aria-hidden="true"></i>
              <input type="text" id="identifier" name="identifier" placeholder="you@example.com" autocomplete="username"
                required>
            </div>
            <p class="field-error" id="identifierError" role="alert"></p>
          </div>

          <div class="field-group">
            <div class="field-label-row">
              <label for="password">Password</label>
              <a href="{{ route('showForgotPasswordForm') }}" class="inline-link">Forgot password?</a>
            </div>
            <div class="input-wrap">
              <i class="bi bi-lock input-icon" aria-hidden="true"></i>
              <input type="password" id="password" name="password" placeholder="Enter your password"
                autocomplete="current-password" required minlength="8">
              <button type="button" class="input-trailing-btn" id="togglePassword" aria-label="Show password"
                aria-pressed="false">
                <i class="bi bi-eye" aria-hidden="true"></i>
              </button>
            </div>
            <p class="field-error" id="passwordError" role="alert"></p>
          </div>

          <div class="field-row-between">
            <label class="checkbox-wrap">
              <input type="checkbox" id="rememberMe" name="rememberMe">
              <span class="checkbox-box" aria-hidden="true"></span>
              <span class="checkbox-label">Remember me</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary-chatify btn-lg-chatify auth-submit" id="signInSubmit">
            <span class="btn-label">Sign in</span>
            <span class="btn-spinner" aria-hidden="true"></span>
          </button>

          <div class="auth-divider"><span>or</span></div>

          <div class="social-row">
            <button type="button" class="btn-social" id="googleSignIn">
              <i class="bi bi-google" aria-hidden="true"></i> Google
            </button>
            <button type="button" class="btn-social" id="appleSignIn">
              <i class="bi bi-apple" aria-hidden="true"></i> Apple
            </button>
          </div>

          <p class="auth-switch">
            Don't have an account?
            <a href="{{ route('show-sign-up') }}">Create one</a>
          </p>
        </form>
      </div>
    </main>

    <!-- OTP Modal -->
    <div class="otp-modal-overlay" id="otpOverlay">
      <div class="otp-modal-card" role="dialog" aria-modal="true" aria-labelledby="otpModalTitle">

        <button class="otp-modal-close" id="otpClose" aria-label="Close">&times;</button>

        <div class="otp-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15v2M7 10V7a5 5 0 0110 0v3" stroke="white" stroke-width="1.8" stroke-linecap="round" />
            <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="white" stroke-width="1.8" />
          </svg>
        </div>

        <h2 id="otpModalTitle">Verify your account</h2>
        <p class="otp-modal-subtitle">
          A 6 digit code is sent to <span class="otp-destination">you@example.com</span>. Enter it below to verify your
          account.
        </p>

        <form id="otpForm" method="post">
          @csrf
          <input type="hidden" name="otp_token" value="">
          <div class="otp-input-row" id="otpInputs">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="0"
              autocomplete="one-time-code">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="1">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="2">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="3">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="4">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-box" data-index="5">
          </div>

          <p class="otp-modal-error" id="otpError"></p>

          <button type="submit" class="btn btn-primary-chatify btn-lg-chatify auth-submit" id="otpSubmit">
            <span class="btn-label">Verify code</span>
            <span class="btn-spinner" aria-hidden="true"></span>
          </button>
        </form>

        <p class="resend-row">
          Didn't get the code?
          <button type="button" id="resendBtn" class="inline-link-btn">Resend</button>
          <span id="resendTimer" class="resend-timer"></span>
        </p>

        <p class="otp-modal-footnote">Your account has been secured. We do not share any of your personal info.</p>
      </div>
    </div>

  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/auth.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

</body>

</html>