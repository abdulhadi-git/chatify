/* ==========================================================================
   CHATIFY — forgot-password.js
   Frontend-only interactions for the Forgot Password flow.
   Two visual states are toggled in place: request → confirmation.
   Replace the fake network delay in handleSendReset() with a real
   Laravel request later — the validation and state-switch logic can stay.
   ========================================================================== */

const RESEND_COOLDOWN_SECONDS = 60;
let resendTimerId = null;
const ROUTES = {
  SendResetLink: '/sendResetLink'
};

document.addEventListener('DOMContentLoaded', () => {
  initForgotPasswordForm();
  initResendControls();
});

function initForgotPasswordForm() {
  const form = document.getElementById('forgotPasswordForm');
  if (!form) return;

  const emailInput = document.getElementById('resetEmail');

  emailInput.addEventListener('blur', () => validateResetEmail(emailInput));
  emailInput.addEventListener('input', () => clearFieldError(emailInput));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateResetEmail(emailInput)) return;
    handleSendReset(emailInput.value.trim());
  });
}

function validateResetEmail(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('resetEmailError');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) return setFieldError(wrap, errorEl, 'Enter your email address.');
  if (!emailPattern.test(value)) return setFieldError(wrap, errorEl, 'Enter a valid email address.');

  clearFieldError(input);
  return true;
}

function handleSendReset(email) {
  const submitBtn = document.getElementById('sendResetSubmit');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  sendResetLink(email);

}

// send reset link
async function sendResetLink(email) {
  const wrapEl = document.getElementById('resetEmail');
  const errorEl = document.getElementById('resetEmailError');
  const submitBtn = document.getElementById('sendResetSubmit');
  let response = await fetch(ROUTES.SendResetLink, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      'email': email
    })
  });
  let result = await response.json();
  if (result.success) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    showConfirmState(email);
    Toastify({
      text: result.message,
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
  } else {
    if (result.exception) {
      setFieldError(wrapEl, errorEl, 'Something went wrong.');
      console.log(result)
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      return;
    }
    setFieldError(wrapEl, errorEl, result.error || result.message);
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}


// resend reset link
async function resendResetLink(email) {
  let response = await fetch(ROUTES.SendResetLink, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      'email': email
    })
  });
  let result = await response.json();
  if (result.success) {
    Toastify({
      text: result.message,
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
  } else {
    Toastify({
      text: result.exception ? 'Something went wrong.' : result.error || result.message,
      duration: 3000,
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#e35d5d",
        borderRadius: "8px",
        color: "#fff",
      },
    }).showToast();
  }
}

function showConfirmState(email) {
  const requestSection = document.getElementById('requestSection');
  const confirmSection = document.getElementById('confirmSection');
  const confirmedEmail = document.getElementById('confirmedEmail');

  confirmedEmail.textContent = email;
  requestSection.hidden = true;
  confirmSection.hidden = false;

  startResendCooldown();

}

function initResendControls() {
  const resendBtn = document.getElementById('resendBtn');
  const changeEmailBtn = document.getElementById('changeEmailBtn');
  const continueBtn = document.getElementById('continueToOtpBtn');
  const emailInput = document.getElementById('resetEmail');

  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      startResendCooldown();
      resendResetLink(emailInput.value.trim());
    });
  }

  if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
      resetToRequestState();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      window.location.href = 'otp-verification.html';
    });
  }
}

function startResendCooldown() {
  const resendBtn = document.getElementById('resendBtn');
  const timerEl = document.getElementById('resendTimer');
  if (!resendBtn || !timerEl) return;

  let remaining = RESEND_COOLDOWN_SECONDS;
  resendBtn.disabled = true;
  resendBtn.hidden = true;
  timerEl.hidden = false;
  timerEl.textContent = `Resend available in ${remaining}s`;

  clearInterval(resendTimerId);
  resendTimerId = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(resendTimerId);
      resendBtn.disabled = false;
      resendBtn.hidden = false;
      timerEl.hidden = true;
      return;
    }
    timerEl.textContent = `Resend available in ${remaining}s`;
  }, 1000);
}

function resetToRequestState() {
  const requestSection = document.getElementById('requestSection');
  const confirmSection = document.getElementById('confirmSection');

  clearInterval(resendTimerId);
  confirmSection.hidden = true;
  requestSection.hidden = false;
}

function setFieldError(wrapEl, errorEl, message) {
  wrapEl.classList.add('has-error');
  errorEl.textContent = message;
  errorEl.classList.add('visible');

  const group = wrapEl.closest('.field-group');
  group.classList.remove('shake');
  void group.offsetWidth;
  group.classList.add('shake');

  return false;
}

function clearFieldError(input) {
  const wrap = input.closest('.input-wrap');
  if (!wrap) return;
  const errorEl = wrap.parentElement.querySelector('.field-error');
  wrap.classList.remove('has-error');
  if (errorEl) {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }
}