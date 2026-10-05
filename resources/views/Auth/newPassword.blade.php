<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>Set a new password — Chatify</title>
<!-- Icons -->
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<!-- Fonts used by var(--font-display) / var(--font-body) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<!-- Shared auth styles -->
<link rel="stylesheet" href="{{ asset('css/auth.css') }}">
<link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body class="auth-body">

  <div class="auth-shell">

    <!-- ================= LEFT BRAND PANEL ================= -->
    <aside class="auth-panel">
      <div class="auth-brand">
        <i class="fa-solid fa-comment-dots" style="font-size:1.1rem; color:#fff;"></i>
        <strong class="auth-brand-name" style="margin-left:8px; font-family:var(--font-display); font-size:1.1rem;">Chatify</strong>
      </div>

      <div>
        <div class="auth-key-icon" id="panelIcon">
          <i class="fa-solid fa-key"></i>
        </div>

        <div class="auth-panel-copy" id="panelCopy">
          <h2>Let's lock in<br>your new password.</h2>
          <p>Choose something strong you haven't used before. You'll use it the next time you sign in to your chats.</p>
        </div>
      </div>

      <div class="auth-panel-footer">
        <i class="fa-solid fa-shield"></i>
        <span>Your new password is encrypted end-to-end.</span>
      </div>
    </aside>

    <!-- ================= RIGHT FORM PANEL ================= -->
    <main class="auth-form-panel">
      <div class="auth-form-wrap" id="authFormWrap">

        <!-- ---------- Password entry state ---------- -->
        <section id="passwordEntrySection">
          <div class="auth-header">
            <h1>Create a new password</h1>
            <p>Your new password must be different from previously used passwords.</p>
          </div>

          <form class="auth-form" id="resetForm" autocomplete="off" method="post">
            @csrf
            <input type="hidden" name="reset_token" value="{{ $token }}" id="reset-token">
            <input type="hidden" name="email" value="{{ $email }}" id="email">

            <div class="field-group" id="newPasswordGroup">
              <div class="field-label-row">
                <label for="newPassword">New password</label>
              </div>

              <div class="input-wrap" id="newPasswordWrap">
                <i class="fa-solid fa-lock input-icon"></i>
                <input type="password" id="newPassword" name="password" placeholder="Enter new password" autocomplete="new-password" required>
                <button type="button" class="input-trailing-btn toggle-visibility" data-target="newPassword" aria-label="Show password">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>

              <div class="strength-meter" id="strengthMeter">
                <span class="strength-bar" data-bar="1"></span>
                <span class="strength-bar" data-bar="2"></span>
                <span class="strength-bar" data-bar="3"></span>
                <span class="strength-bar" data-bar="4"></span>
              </div>
              <p class="strength-label" id="strengthLabel">Use 8+ characters, 1 uppercase letter and 1 number</p>

              <p class="field-error" id="newPasswordError">Password doesn't meet the requirements above.</p>
            </div>

            <div class="field-group" id="confirmPasswordGroup">
              <div class="field-label-row">
                <label for="confirmPassword">Confirm password</label>
              </div>

              <div class="input-wrap" id="confirmPasswordWrap">
                <i class="fa-solid fa-lock input-icon"></i>
                <input type="password" id="confirmPassword" name="password_confirmation" placeholder="Re-enter new password" autocomplete="new-password" required>
                <button type="button" class="input-trailing-btn toggle-visibility" data-target="confirmPassword" aria-label="Show password">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>

              <p class="field-error" id="confirmPasswordError">Passwords don't match. Try again.</p>
            </div>

            <button type="submit" class="btn btn-primary-chatify btn-lg-chatify auth-submit" id="submitBtn">
              <span class="btn-label">Reset password</span>
              <span class="btn-spinner"></span>
            </button>
          </form>
        </section>

        <!-- ---------- Success / confirmation state ---------- -->
        <section class="confirm-section" id="successSection" style="display:none;">
          <div class="confirm-icon">
            <i class="fa-solid fa-check"></i>
          </div>
          <h1>Password changed successfully</h1>
          <p class="confirm-text">Your password has been updated. Redirecting you to sign in&hellip;</p>

          <div class="redirect-row">
            <span id="redirectText">Redirecting you&hellip;</span>
          </div>

          <div class="progress-track">
            <div class="progress-fill" id="progressFill"></div>
          </div>
        </section>

      </div>
    </main>

  </div>


    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
      @vite(['resources/js/reset-password.js'])

</body>
</html>