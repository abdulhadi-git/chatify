/* ==========================================================================
   CHATIFY — signup.js
   Frontend-only validation & interactions for the Sign Up page.
   Replace the fake network delay in handleSignUpSubmit() with a real
   Laravel request later — the validation functions can stay as-is.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initStrengthMeter();
  initSignUpForm();
});
window.addEventListener('pageshow', function(event){
  if(event.persisted){
      window.location.reload();
  }
});

/**
 * Wires up show/hide toggles for both password fields.
 */
function initPasswordToggles() {
  wireToggle('toggleSignupPassword', 'signupPassword');
  wireToggle('toggleConfirmPassword', 'confirmPassword');
}

function wireToggle(buttonId, inputId) {
  const btn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(isHidden));
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    btn.innerHTML = isHidden
      ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
      : '<i class="bi bi-eye" aria-hidden="true"></i>';
  });
}

/**
 * Updates the visual password-strength meter as the user types.
 */
function initStrengthMeter() {
  const passwordInput = document.getElementById('signupPassword');
  const meter = document.getElementById('strengthMeter');
  const label = document.getElementById('strengthLabel');
  if (!passwordInput || !meter || !label) return;

  passwordInput.addEventListener('input', () => {
    const { level, text } = scorePasswordStrength(passwordInput.value);

    meter.classList.remove('weak', 'fair', 'good', 'strong');
    label.classList.remove('weak', 'fair', 'good', 'strong');

    if (passwordInput.value.length === 0) {
      label.textContent = 'Use 8+ characters with a number and a symbol';
      return;
    }

    meter.classList.add(level);
    label.classList.add(level);
    label.textContent = text;
  });
}

/**
 * Scores password strength on four simple signals:
 * length, lowercase+uppercase mix, numbers, special characters.
 * @param {string} value
 * @returns {{level: 'weak'|'fair'|'good'|'strong', text: string}}
 */
function scorePasswordStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { level: 'weak', text: 'Weak — try adding a number or symbol' },
    { level: 'fair', text: 'Fair — add an uppercase letter or symbol' },
    { level: 'good', text: 'Good — almost a strong password' },
    { level: 'strong', text: 'Strong password' }
  ];

  const index = Math.max(0, Math.min(score - 1, levels.length - 1));
  return value.length > 0 ? levels[index] : { level: 'weak', text: '' };
}

/**
 * Wires up validation + fake submit flow for the Sign Up form.
 */
function initSignUpForm() {
  const form = document.getElementById('signUpForm');
  if (!form) return;

  const fields = {
    fullName: document.getElementById('fullName'),
    username: document.getElementById('username'),
    email: document.getElementById('signupEmail'),
    phone: document.getElementById('phone'),
    password: document.getElementById('signupPassword'),
    confirmPassword: document.getElementById('confirmPassword')
  };
  const termsCheckbox = document.getElementById('agreeTerms');

  // Validate on blur, clear on input.
  Object.values(fields).forEach((input) => {
    input.addEventListener('blur', () => validateSignUpField(input.id, fields));
    input.addEventListener('input', () => clearFieldError(input));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let allValid = true;
    Object.values(fields).forEach((input) => {
      const isValid = validateSignUpField(input.id, fields);
      allValid = allValid && isValid;
    });

    const termsValid = validateTerms(termsCheckbox);
    allValid = allValid && termsValid;

    if (!allValid) return;

    form.submit();
  });
}

/**
 * Dispatches to the correct validator based on field id.
 * @param {string} fieldId
 * @param {Object} fields - map of all form fields, needed to cross-check confirmPassword
 * @returns {boolean}
 */
function validateSignUpField(fieldId, fields) {
  switch (fieldId) {
    case 'fullName':
      return validateFullName(fields.fullName);
    case 'username':
      return validateUsername(fields.username);
    case 'signupEmail':
      return validateSignupEmail(fields.email);
    case 'phone':
      return validatePhone(fields.phone);
    case 'signupPassword':
      return validateSignupPassword(fields.password);
    case 'confirmPassword':
      return validateConfirmPassword(fields.password, fields.confirmPassword);
    default:
      return true;
  }
}

function validateFullName(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('fullNameError');

  if (!value) return setFieldError(wrap, errorEl, 'Enter your full name.');
  if (value.length < 2) return setFieldError(wrap, errorEl, 'Name looks too short.');

  clearFieldError(input);
  return true;
}

function validateUsername(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('usernameError');
  const pattern = /^[a-zA-Z0-9_]{3,20}$/;

  if (!value) return setFieldError(wrap, errorEl, 'Choose a username.');
  if (!pattern.test(value)) {
    return setFieldError(wrap, errorEl, '3-20 characters: letters, numbers, underscores.');
  }

  clearFieldError(input);
  return true;
}

function validateSignupEmail(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('signupEmailError');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) return setFieldError(wrap, errorEl, 'Enter your email address.');
  if (!emailPattern.test(value)) return setFieldError(wrap, errorEl, 'Enter a valid email address.');

  clearFieldError(input);
  return true;
}

function validatePhone(input) {
  const value = input.value.trim();
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('phoneError');
  const phonePattern = /^\+?[0-9\s-]{7,15}$/;

  if (!value) return setFieldError(wrap, errorEl, 'Enter your phone number.');
  if (!phonePattern.test(value)) return setFieldError(wrap, errorEl, 'Enter a valid phone number.');

  clearFieldError(input);
  return true;
}

function validateSignupPassword(input) {
  const value = input.value;
  const wrap = input.closest('.input-wrap');
  const errorEl = document.getElementById('signupPasswordError');

  if (!value) return setFieldError(wrap, errorEl, 'Create a password.');
  if (value.length < 8) return setFieldError(wrap, errorEl, 'Use at least 8 characters.');

  clearFieldError(input);
  return true;
}

function validateConfirmPassword(passwordInput, confirmInput) {
  const wrap = confirmInput.closest('.input-wrap');
  const errorEl = document.getElementById('confirmPasswordError');

  if (!confirmInput.value) return setFieldError(wrap, errorEl, 'Re-enter your password.');
  if (confirmInput.value !== passwordInput.value) {
    return setFieldError(wrap, errorEl, 'Passwords do not match.');
  }

  clearFieldError(confirmInput);
  return true;
}

function validateTerms(checkbox) {
  const errorEl = document.getElementById('termsError');
  if (!checkbox.checked) {
    errorEl.textContent = 'You must agree to the Terms and Privacy Policy.';
    errorEl.classList.add('visible');
    return false;
  }
  errorEl.classList.remove('visible');
  errorEl.textContent = '';
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
  if (!wrap) return;
  const errorEl = wrap.parentElement.querySelector('.field-error');
  wrap.classList.remove('has-error');
  if (errorEl) {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }
}


