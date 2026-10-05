<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Create Account — Chatify</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

<link rel="stylesheet" href="{{ asset('css/auth.css') }}">
<link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body class="auth-body">

<div class="auth-shell">

  <!-- ============ LEFT: BRAND PANEL ============ -->
  <aside class="auth-panel" aria-hidden="true">
    <a href="index.html" class="brand auth-brand">
      <span class="brand-mark">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z" fill="url(#brandGrad4)"/>
          <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
          <defs>
            <linearGradient id="brandGrad4" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stop-color="#F4FBFA"/>
              <stop offset="1" stop-color="#CFF4EF"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span class="brand-name auth-brand-name">Chatify</span>
    </a>

    <div class="auth-panel-copy">
      <h2>Join the conversation.<br>Free, fast, and built<br>for real connection.</h2>
      <p>Create an account to start chatting, calling, and building groups with the people who matter to you.</p>
    </div>

    <!-- Mini social-proof strip -->
    <div class="auth-stat-row">
      <div class="auth-stat">
        <span class="auth-stat-avatars" aria-hidden="true">
          <span class="stat-avatar">AK</span>
          <span class="stat-avatar">SR</span>
          <span class="stat-avatar">MJ</span>
        </span>
        <div>
          <strong>12,400+</strong>
          <span>people chatting today</span>
        </div>
      </div>
    </div>

    <div class="auth-panel-footer">
      <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
      Your details are encrypted and never sold to third parties.
    </div>
  </aside>

  <!-- ============ RIGHT: FORM PANEL ============ -->
  <main class="auth-form-panel">
    <div class="auth-form-wrap auth-form-wrap-wide">

      <a href="index.html" class="brand auth-brand-mobile d-lg-none">
        <span class="brand-mark">
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8C4 5.79086 5.79086 4 8 4H22C24.2091 4 26 5.79086 26 8V17C26 19.2091 24.2091 21 22 21H12.5L6.5 26V21H8C5.79086 21 4 19.2091 4 17V8Z" fill="url(#brandGrad5)"/>
            <circle cx="10.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <circle cx="15" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <circle cx="19.5" cy="12.5" r="1.5" fill="#F4FBFA"/>
            <defs>
              <linearGradient id="brandGrad5" x1="4" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1FC9BE"/>
                <stop offset="1" stop-color="#0D7D76"/>
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="brand-name">Chatify</span>
      </a>

      <header class="auth-header">
        <h1>Create your account</h1>
        <p>It only takes a minute to get started.</p>
      </header>

      <form id="signUpForm" class="auth-form" method="POST" action="{{ route('sign-up') }}">
        @csrf

        {{-- General errors (e.g. anything not tied to a specific field) --}}
        @if ($errors->any() && !$errors->hasAny(['fullName','username','email','phone','password']))
          <div class="alert alert-danger">
            {{ $errors->first() }}
          </div>
        @endif

        <div class="field-pair">
          <div class="field-group">
            <label for="fullName">Full name</label>
            <div class="input-wrap">
              <i class="bi bi-person input-icon" aria-hidden="true"></i>
              <input type="text" id="fullName" name="fullName" value="{{ old('fullName') }}" placeholder="Ahmed Khan" autocomplete="name" required>
            </div>
            <p class="field-error @error('fullName') visible @enderror" id="fullNameError" role="alert">
              @error('fullName') {{ $message }} @enderror
            </p>
          </div>

          <div class="field-group">
            <label for="username">Username</label>
            <div class="input-wrap">
              <i class="bi bi-at input-icon" aria-hidden="true"></i>
              <input type="text" id="username" name="username" value="{{ old('username') }}" placeholder="ahmedkhan" autocomplete="username" required>
            </div>
            <p class="field-error @error('username') visible @enderror" id="usernameError" role="alert">
              @error('username') {{ $message }} @enderror
            </p>
          </div>
        </div>

        <div class="field-pair">
          <div class="field-group">
            <label for="signupEmail">Email</label>
            <div class="input-wrap">
              <i class="bi bi-envelope input-icon" aria-hidden="true"></i>
              <input type="email" id="signupEmail" name="email" value="{{ old('email') }}" placeholder="you@example.com" autocomplete="email" required>
            </div>
            <p class="field-error @error('email') visible @enderror" id="signupEmailError" role="alert">
              @error('email') {{ $message }} @enderror
            </p>
          </div>

          <div class="field-group">
            <label for="phone">Phone number</label>
            <div class="input-wrap">
              <i class="bi bi-phone input-icon" aria-hidden="true"></i>
              <input type="tel" id="phone" name="phone" value="{{ old('phone') }}" placeholder="+92 300 1234567" autocomplete="tel" required>
            </div>
            <p class="field-error @error('phone') visible @enderror" id="phoneError" role="alert">
              @error('phone') {{ $message }} @enderror
            </p>
          </div>
        </div>

        <div class="field-group">
          <label for="signupPassword">Password</label>
          <div class="input-wrap">
            <i class="bi bi-lock input-icon" aria-hidden="true"></i>
            <input type="password" id="signupPassword" name="password" placeholder="Create a password" autocomplete="new-password" required minlength="8">
            <button type="button" class="input-trailing-btn" id="toggleSignupPassword" aria-label="Show password" aria-pressed="false">
              <i class="bi bi-eye" aria-hidden="true"></i>
            </button>
          </div>

          <div class="strength-meter" id="strengthMeter" aria-hidden="true">
            <span class="strength-bar" data-bar="1"></span>
            <span class="strength-bar" data-bar="2"></span>
            <span class="strength-bar" data-bar="3"></span>
            <span class="strength-bar" data-bar="4"></span>
          </div>
          <p class="strength-label" id="strengthLabel">Use 8+ characters with a number and a symbol</p>

          <p class="field-error @error('password') visible @enderror" id="signupPasswordError" role="alert">
            @error('password') {{ $message }} @enderror
          </p>
        </div>

        <div class="field-group">
          <label for="confirmPassword">Confirm password</label>
          <div class="input-wrap">
            <i class="bi bi-lock-fill input-icon" aria-hidden="true"></i>
            {{-- name MUST be password_confirmation so Laravel's `confirmed` rule works --}}
            <input type="password" id="confirmPassword" name="password_confirmation" placeholder="Re-enter your password" autocomplete="new-password" required>
            <button type="button" class="input-trailing-btn" id="toggleConfirmPassword" aria-label="Show password" aria-pressed="false">
              <i class="bi bi-eye" aria-hidden="true"></i>
            </button>
          </div>
          <p class="field-error" id="confirmPasswordError" role="alert"></p>
        </div>

        <label class="checkbox-wrap terms-check">
          <input type="checkbox" id="agreeTerms" name="agreeTerms" {{ old('agreeTerms') ? 'checked' : '' }}>
          <span class="checkbox-box" aria-hidden="true"></span>
          <span class="checkbox-label">
            I agree to Chatify's <a href="#" class="inline-link">Terms of Service</a> and <a href="#" class="inline-link">Privacy Policy</a>
          </span>
        </label>
        <p class="field-error" id="termsError" role="alert"></p>

        <button type="submit" class="btn btn-primary-chatify btn-lg-chatify auth-submit" id="signUpSubmit">
          <span class="btn-label">Create account</span>
          <span class="btn-spinner" aria-hidden="true"></span>
        </button>

        <p class="auth-switch">
          Already have an account?
          <a href="{{ route('show-sign-in') }}">Sign in</a>
        </p>
      </form>
    </div>
  </main>
</div>

<div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/signup.js'])

</body>
</html>