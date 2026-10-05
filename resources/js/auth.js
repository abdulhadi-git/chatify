/* ==========================================================================
   CHATIFY — auth.js
   Frontend-only validation & interactions shared/extended across the
   authentication flow. This file currently covers the Sign In page.
   Replace the fake network delay in handleSignInSubmit() with a real
   Laravel request later — the validation functions can stay as-is.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initSignInForm();
  initSocialButtons();
});
window.addEventListener('pageshow', function(event){
  if(event.persisted){
      window.location.reload();
  }
});

const overlay = document.getElementById('otpOverlay');
const closeBtn = document.getElementById('otpClose');
const otpForm = document.getElementById('otpForm');
const boxes = Array.from(document.querySelectorAll('.otp-box'));
const errorEl = document.getElementById('otpError');
const otpDestination = document.querySelector('.otp-destination');
const submitBtn = document.getElementById('otpSubmit');
const resendBtn = document.getElementById('resendBtn');
const resendTimerEl = document.getElementById('resendTimer');
const otpToken = document.querySelector('input[name="otp_token"]');


const RESEND_SECONDS = 30;
let resendInterval = null;

function openModal() {
  overlay.classList.add('active');
  resetForm();
  setTimeout(() => boxes[0].focus(), 150);
  startResendTimer();
}

function closeModal() {
  overlay.classList.remove('active');
  clearInterval(resendInterval);
}

function resetForm() {
  boxes.forEach(b => {
    b.value = '';
    b.classList.remove('filled', 'shake');
  });
  errorEl.classList.remove('show');
  submitBtn.disabled = false;
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
});

// ---- OTP box behavior ----
boxes.forEach((box, i) => {
  box.addEventListener('input', (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = val.slice(-1);

    if (e.target.value) {
      e.target.classList.add('filled');
      if (boxes[i + 1]) boxes[i + 1].focus();
    } else {
      e.target.classList.remove('filled');
    }
    errorEl.classList.remove('show');
  });

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && boxes[i - 1]) {
      boxes[i - 1].focus();
    }
    if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
    if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
  });

  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, 6)
      .split('');

    pasted.forEach((digit, idx) => {
      if (boxes[idx]) {
        boxes[idx].value = digit;
        boxes[idx].classList.add('filled');
      }
    });
    const nextIndex = Math.min(pasted.length, boxes.length - 1);
    boxes[nextIndex].focus();
  });
});

// error 

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
  boxes.forEach(b => {
    b.classList.add('shake');
    setTimeout(() => b.classList.remove('shake'), 400);
  });
  
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');

}

// otp form submit

otpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = boxes.map(b => b.value).join('');

  if (code.length < 6) {
    showError('Enter valid 6 digit code.');
    return;
  }
  errorEl.classList.remove('visible');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  verifyOtp(code);
});

// verify otp code
async function verifyOtp(otpCode) {
  let response = await fetch(ROUTES.verifyOtp, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    },
    body: JSON.stringify({
      'otp_token': otpToken.value,
      'otp_code': otpCode
    })
  });
  let result = await response.json();
  if (result.success) {
    overlay.classList.remove('active');
    let timerInterval;
    Swal.fire({
      title: "Verified successfully",
      html: "Redirecting you...",
      timer: 1500,
      didOpen: () => {
        Swal.showLoading();
        const timer = Swal.getPopup().querySelector("b");
        timerInterval = setInterval(() => {
          timer.textContent = `${Swal.getTimerLeft()}`;
        }, 100);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then(() => {
      window.location.href = ROUTES.Dashboard;
    });
  } else{
    showError(result.message);
  }

}

// request new otp
async function requestNewOtp() {
  let response = await fetch(ROUTES.resendNewOTPRoute, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      otp_token: document.querySelector('input[name="otp_token"]').value
    })
  });
  let result = await response.json();
  if (result.success) {
    Toastify({
      text: "New OTP sent successfully.",
      duration: 3000,
      close: true,
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#13B0A7",
        borderRadius: "8px",
        color: "#fff",
      },

    }).showToast();
  }
}

// ---- Resend timer ----
function startResendTimer() {
  let seconds = RESEND_SECONDS;
  resendBtn.disabled = true;
  resendTimerEl.textContent = `(${seconds}s)`;
  clearInterval(resendInterval);

  resendInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(resendInterval);
      resendBtn.disabled = false;
      resendTimerEl.textContent = '';
    } else {
      resendTimerEl.textContent = `(${seconds}s)`;
    }
  }, 1000);
}

resendBtn.addEventListener('click', () => {
  if (resendBtn.disabled) return;
  requestNewOtp();
  startResendTimer();
});

// Routes
const ROUTES = {
  Login: '/login',
  Dashboard: '/chats',
  verifyOtp: '/verify-otp',
  resendNewOTPRoute: 'resend-otp'
}

/**
 * Toggles password visibility on the Sign In field.
 */
function initPasswordToggle() {
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    toggleBtn.innerHTML = isHidden
      ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
      : '<i class="bi bi-eye" aria-hidden="true"></i>';
  });
}

/**
 * Wires up validation + fake submit flow for the Sign In form.
 */
function initSignInForm() {
  const form = document.getElementById('signInForm');
  if (!form) return;

  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');

  // Validate on blur for immediate feedback, then re-validate on submit.
  identifierInput.addEventListener('blur', () => validateIdentifier(identifierInput));
  passwordInput.addEventListener('blur', () => validatePassword(passwordInput));

  // Clear error state as the user starts fixing a field.
  identifierInput.addEventListener('input', () => clearFieldError(identifierInput));
  passwordInput.addEventListener('input', () => clearFieldError(passwordInput));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const isIdentifierValid = validateIdentifier(identifierInput);
    const isPasswordValid = validatePassword(passwordInput);

    if (!isIdentifierValid || !isPasswordValid) {
      return;
    }

    handleSignInSubmit(identifierInput, passwordInput);
  });
}

/**
 * Validates the "email or username" field.
 * If the value looks like an email (contains "@"), it must match a
 * standard email pattern. Otherwise it's treated as a username and
 * just needs a minimum length.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function validateIdentifier(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('identifierError');

  if (!value) {
    return setFieldError(wrap, errorEl, 'Enter your email or username.');
  }

  if (value.includes('@')) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return setFieldError(wrap, errorEl, 'Enter a valid email address.');
    }
  } else if (value.length < 3) {
    return setFieldError(wrap, errorEl, 'Username must be at least 3 characters.');
  }

  clearFieldError(input);
  return true;
}

/**
 * Validates the password field against a minimum length.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function validatePassword(input) {
  const value = input.value;
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('passwordError');

  if (!value) {
    return setFieldError(wrap, errorEl, 'Enter your password.');
  }
  if (value.length < 8) {
    return setFieldError(wrap, errorEl, 'Password must be at least 8 characters.');
  }

  clearFieldError(input);
  return true;
}

/**
 * Applies the error state to a field: red border, message, shake animation.
 * @returns {boolean} always false, so callers can `return setFieldError(...)`
 */
function setFieldError(wrapEl, errorEl, message) {
  wrapEl.classList.add('has-error');
  errorEl.textContent = message;
  errorEl.classList.add('visible');

  const group = wrapEl.closest('.field-group');
  group.classList.remove('shake');
  // Force reflow so the shake animation can re-trigger on repeated errors.
  void group.offsetWidth;
  group.classList.add('shake');

  return false;
}

/**
 * Clears the error state for a given input.
 * @param {HTMLInputElement} input
 */
function clearFieldError(input) {
  const wrap = input.closest('.input-wrap');
  const errorEl = wrap.parentElement.querySelector('.field-error');
  wrap.classList.remove('has-error');
  if (errorEl) {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }
}

/**
 * Simulates a Sign In network request with a loading state on the button.
 * TODO: replace the setTimeout block with a real fetch()/axios call to
 * the Laravel auth endpoint, and redirect to the inbox on success.
 */
function handleSignInSubmit(emailOrUsername, password) {
  const submitBtn = document.getElementById('signInSubmit');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  async function attempLogin(identifier, password) {
    let response = await fetch(ROUTES.Login, {
      method: 'POST',
      headers: {
        'Accept': 'Application/json',
        'Content-type': 'Application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
      body: JSON.stringify({
        'identifier': identifier.value,
        'password': password.value
      })
    });
    let result = await response.json();
    if (result.success) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      window.location.href = ROUTES.Dashboard;
    } else if (result.is_unverified) {
      openModal();
      otpToken.value = result.otp_token;
      otpDestination.textContent = result.email;

    } else {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      setFieldError(identifier.closest('.input-wrap'), document.getElementById('identifierError'), result.message);
    }
  };

  attempLogin(emailOrUsername, password)
}


/**
 * Placeholder handlers for social sign-in buttons.
 */
function initSocialButtons() {
  const googleBtn = document.getElementById('googleSignIn');
  const appleBtn = document.getElementById('appleSignIn');

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      showToast('Google sign-in will connect here', 'bi-google');
    });
  }
  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      showToast('Apple sign-in will connect here', 'bi-apple');
    });
  }
}

