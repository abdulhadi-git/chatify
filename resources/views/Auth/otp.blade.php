<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>Verify your identity — Chatify</title>
<!-- Icons -->
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<!-- Fonts used by var(--font-display) / var(--font-body) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<!-- Shared auth styles -->
<link rel="stylesheet" href="{{ asset('css/auth.css') }}">

<style>
  /* -----------------------------------------------------------------------
     NOTE: agar aapke project mein already ek global tokens/base.css file
     hai jahan yeh variables (--primary, --ink, --r-sm, etc.) define hain,
     to yeh block hata dein — yeh sirf standalone preview ke liye hai.
     ----------------------------------------------------------------------- */
  :root {
    --primary: #17a68f;
    --primary-dark: #0e6f60;
    --primary-light: #5eead4;
    --primary-tint: rgba(23, 166, 143, 0.12);
    --background: #ffffff;
    --surface: #f3f8f7;
    --ink: #16241f;
    --ink-soft: #33443e;
    --muted: #6b7c78;
    --border: #dfe8e6;
    --danger: #e35d5d;
    --r-sm: 10px;
    --r-md: 16px;
    --r-pill: 999px;
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --font-display: 'Poppins', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-body); }
  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body class="auth-body">

  <div class="auth-shell">

    <!-- ================= LEFT BRAND PANEL ================= -->
    <aside class="auth-panel">
      <div class="auth-brand">
        <i class="fa-solid fa-comment-dots" style="font-size:1.1rem;"></i>
        <strong class="auth-brand-name" style="margin-left:8px; font-family:var(--font-display); font-size:1.1rem;">Chatify</strong>
      </div>

      <div>
        <div class="auth-otp-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>

        <div class="auth-panel-copy">
          <h2>One last step to<br>secure your account.</h2>
          <p>We've sent a 6-digit code to your email. Enter it below to confirm it's really you.</p>
        </div>
      </div>

      <div class="auth-panel-footer">
        <i class="fa-solid fa-shield"></i>
        <span>Codes expire after 10 minutes for your security.</span>
      </div>
    </aside>

    <!-- ================= RIGHT FORM PANEL ================= -->
    <main class="auth-form-panel">
      <div class="auth-form-wrap" id="authFormWrap">

        <a href="signin.html" class="back-link">
          <i class="fa-solid fa-arrow-left"></i> Back to sign in
        </a>

        <!-- ---------- OTP entry state ---------- -->
        <section id="otpEntrySection">
          <div class="auth-header">
            <h1>Enter verification code</h1>
            <p>We sent a 6-digit code to <span class="otp-destination" id="destinationEmail">{{ $otpData['email'] }}</span></p>
          </div>

          <form class="auth-form" id="otpForm" autocomplete="off" method="post">
            @csrf
           <input type="hidden" name="otp_token" value="{{ $token }}">
            <div class="field-group" id="otpGroup">
              <div class="field-label-row">
                <label for="otp-0">Verification code</label>
              </div>

              <div class="otp-input-row" id="otpInputRow">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-0" data-index="0" autocomplete="one-time-code">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-1" data-index="1">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-2" data-index="2">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-3" data-index="3">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-4" data-index="4">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" id="otp-5" data-index="5">
              </div>

              <p class="field-error" id="otpError">The code you entered is incorrect. Try again.</p>
            </div>

            <button type="submit" class="btn-social auth-submit" id="verifyBtn" style="background:var(--primary); color:#fff; border-color:var(--primary);">
              <span class="btn-label">Verify code</span>
              <span class="btn-spinner"></span>
            </button>
          </form>

          <p class="resend-row">
            Didn't get the code?
            <button type="button" class="inline-link-btn" id="resendBtn" disabled>
              Resend code <span class="resend-timer" id="resendTimer">(0:30)</span>
            </button>
          </p>
        </section>

        <!-- ---------- Success / confirmation state ---------- -->
        <section class="confirm-section" id="otpSuccessSection" style="display:none;">
          <div class="confirm-icon">
            <i class="fa-solid fa-check"></i>
          </div>
          <h1>You're verified!</h1>
          <p class="confirm-text">Your identity has been confirmed. Taking you back to <strong>Chatify</strong> now&hellip;</p>
        </section>

      </div>
    </main>

  </div>

    @vite(['resources/js/otp.js'])

  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
</body>
</html>