window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

document.addEventListener('DOMContentLoaded', function () {

  var newPassword = document.getElementById('newPassword');
  var reset_token = document.getElementById('reset-token');
  var email = document.getElementById('email');
  var confirmPassword = document.getElementById('confirmPassword');
  var newPasswordWrap = document.getElementById('newPasswordWrap');
  var confirmPasswordWrap = document.getElementById('confirmPasswordWrap');
  var newPasswordGroup = document.getElementById('newPasswordGroup');
  var confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  var newPasswordError = document.getElementById('newPasswordError');
  var confirmPasswordError = document.getElementById('confirmPasswordError');
  var strengthMeter = document.getElementById('strengthMeter');
  var strengthLabel = document.getElementById('strengthLabel');
  var strengthBars = strengthMeter ? strengthMeter.querySelectorAll('.strength-bar') : [];
  var form = document.getElementById('resetForm');
  var submitBtn = document.getElementById('submitBtn');

  var passwordEntrySection = document.getElementById('passwordEntrySection');
  var successSection = document.getElementById('successSection');
  var backLink = document.getElementById('backLink'); // optional — page may not have this link
  var panelCopy = document.getElementById('panelCopy');
  var panelIcon = document.getElementById('panelIcon');
  var progressFill = document.getElementById('progressFill');
  var redirectText = document.getElementById('redirectText');

  var REDIRECT_URL = '/signin';
  var CHANGE_PASSWORD_URL = '/changePassword';
  var REDIRECT_DELAY = 2600;

  /* ---------- show / hide password ---------- */
  document.querySelectorAll('.toggle-visibility').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.target);
      var icon = btn.querySelector('i');
      var isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !isHidden);
      icon.classList.toggle('fa-eye-slash', isHidden);
    });
  });

  /* ---------- live password requirement checks ---------- */
  function checkRules(value) {
    return {
      len: value.length >= 8,
      upper: /[A-Z]/.test(value),
      num: /[0-9]/.test(value)
    };
  }

  var STRENGTH_LEVELS = [
    { key: '', label: 'Use 8+ characters, 1 uppercase letter and 1 number' },
    { key: 'weak', label: 'Weak — try adding more characters' },
    { key: 'fair', label: 'Fair — add an uppercase letter or a number' },
    { key: 'good', label: 'Good — almost there' },
    { key: 'strong', label: 'Strong password' }
  ];

  function updateStrengthMeter(value) {
    if (!strengthMeter) return;

    var score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (value.length >= 12 && /[^A-Za-z0-9]/.test(value)) score++;

    if (value.length === 0) score = 0;

    var level = STRENGTH_LEVELS[score];

    strengthMeter.classList.remove('weak', 'fair', 'good', 'strong');
    if (level.key) strengthMeter.classList.add(level.key);

    if (strengthLabel) {
      strengthLabel.textContent = level.label;
      strengthLabel.classList.remove('weak', 'fair', 'good', 'strong');
      if (level.key) strengthLabel.classList.add(level.key);
    }
  }

  newPassword.addEventListener('input', function () {
    updateStrengthMeter(newPassword.value);
    clearFieldError(newPasswordWrap, newPasswordGroup, newPasswordError);
  });

  confirmPassword.addEventListener('input', function () {
    clearFieldError(confirmPasswordWrap, confirmPasswordGroup, confirmPasswordError);
  });

  function setFieldError(wrap, group, errorEl) {
    wrap.classList.add('has-error');
    errorEl.classList.add('visible');
    group.classList.remove('shake');
    // restart the shake animation
    void group.offsetWidth;
    group.classList.add('shake');
  }

  function clearFieldError(wrap, group, errorEl) {
    wrap.classList.remove('has-error');
    errorEl.classList.remove('visible');
    group.classList.remove('shake');
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var value = newPassword.value;
    var rules = checkRules(value);
    var rulesOk = rules.len && rules.upper && rules.num;
    var valid = true;

    if (!rulesOk) {
      setFieldError(newPasswordWrap, newPasswordGroup, newPasswordError);
      valid = false;
    }

    if (!confirmPassword.value || confirmPassword.value !== value) {
      setFieldError(confirmPasswordWrap, confirmPasswordGroup, confirmPasswordError);
      valid = false;
    }

    if (!valid) {
      if (typeof Toastify === 'function') {
        Toastify({
          text: 'Please fix the highlighted fields.',
          duration: 2500,
          gravity: 'top',
          position: 'right',
          style: { background: '#e35d5d' }
        }).showToast();
      }
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    resetPassword();

    // Simulated request — replace with a real fetch() call to your
    // Laravel reset-password endpoint (uses the csrf-token meta tag above).
    async function resetPassword() {
      let response = await fetch(CHANGE_PASSWORD_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          'token': reset_token.value,
          'email': email.value,
          'password': newPassword.value,
          'confirm_password': confirmPassword.value
        })
      });
      let result = await response.json();
      if (result.success) {
        showSuccessState();
      } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        Toastify({
          text: result.message,
          duration: 2500,
          gravity: 'top',
          position: 'right',
          style: { background: '#e35d5d' }
        }).showToast();
      }

    }
  });

  /* ---------- success state ---------- */
  function showSuccessState() {
    passwordEntrySection.style.display = 'none';
    if (backLink) backLink.style.display = 'none';
    successSection.style.display = 'block';

    if (panelIcon) {
      panelIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
    if (panelCopy) {
      panelCopy.querySelector('h2').innerHTML = "You're all set.";
      panelCopy.querySelector('p').textContent = 'Your password has been changed. Head back and sign in with your new password.';
    }

    requestAnimationFrame(function () {
      progressFill.style.width = '100%';
    });

    setTimeout(function () {
      redirectText.textContent = 'Redirecting…';
    }, REDIRECT_DELAY - 200);

    setTimeout(function () {
      window.location.href = REDIRECT_URL;
    }, REDIRECT_DELAY);
  }

});