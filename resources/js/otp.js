/* ==========================================================================
   CHATIFY — OTP VERIFICATION LOGIC
   Handles: box-to-box auto-advance, paste support, backspace navigation,
   resend cooldown timer, fake verify request + success state swap.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Config -------------------------------------------------------------
  const CODE_LENGTH = 6;
  const RESEND_COOLDOWN_SECONDS = 30;
  const CORRECT_CODE = '123456'; // demo only — replace with real API check
  const ROUTE = {
    verifyOtpRoute: '/verify-otp',
    singinRoute: '/signin',
    resendNewOTPRoute: '/resend-otp'
  };

  // ---- Elements -------------------------------------------------------------
  const otpGroup = document.getElementById('otpGroup');
  const otpInputs = Array.from(document.querySelectorAll('.otp-box'));
  const otpForm = document.getElementById('otpForm');
  const otpError = document.getElementById('otpError');
  const verifyBtn = document.getElementById('verifyBtn');
  const resendBtn = document.getElementById('resendBtn');
  const resendTimerEl = document.getElementById('resendTimer');
  const changeEmailTop = document.getElementById('changeEmailTop');
  const otpEntrySection = document.getElementById('otpEntrySection');
  const otpSuccessSection = document.getElementById('otpSuccessSection');

  let resendInterval = null;

  // ---- OTP box behaviour ----------------------------------------------------
  otpInputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      // keep digits only
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);

      clearError();

      if (input.value) {
        input.classList.add('filled');
        const next = otpInputs[i + 1];
        if (next) next.focus();
      } else {
        input.classList.remove('filled');
      }

      if (getCode().length === CODE_LENGTH) {
        // small delay so the last digit visibly lands before submit
        setTimeout(() => otpForm.requestSubmit(), 120);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        const prev = otpInputs[i - 1];
        prev.focus();
        prev.value = '';
        prev.classList.remove('filled');
      }
      if (e.key === 'ArrowLeft' && i > 0) otpInputs[i - 1].focus();
      if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) otpInputs[i + 1].focus();
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, CODE_LENGTH);

      if (!pasted) return;

      pasted.split('').forEach((digit, idx) => {
        if (otpInputs[idx]) {
          otpInputs[idx].value = digit;
          otpInputs[idx].classList.add('filled');
        }
      });

      const nextEmpty = otpInputs.find((box) => !box.value);
      (nextEmpty || otpInputs[CODE_LENGTH - 1]).focus();

      if (getCode().length === CODE_LENGTH) {
        setTimeout(() => otpForm.requestSubmit(), 120);
      }
    });
  });

  // autofocus first box on load
  otpInputs[0].focus();

  function getCode() {
    return otpInputs.map((box) => box.value).join('');
  }

  function clearError() {
    otpError.classList.remove('visible');
    otpGroup.classList.remove('shake');
    otpInputs.forEach((box) => box.classList.remove('error'));
  }

  function showError(message) {
    otpError.textContent = message;
    otpError.classList.add('visible');
    otpGroup.classList.add('shake');
    otpInputs.forEach((box) => {box.classList.add('error'); box.classList.remove('filled'); box.value = '';});
    otpInputs[0].select();
    otpInputs[0].focus();

    setLoading(false);
  }

  function showSuccess() {
    otpInputs.forEach((box) => {
      box.classList.remove('error');
      box.classList.add('success');
      box.disabled = true;
    });
    setTimeout(() => {
      otpEntrySection.style.display = 'none';
      otpSuccessSection.style.display = 'block';
      window.location.href = ROUTE.signinRoute; // redirect to sign-in page after success
    }, 350);
  }

  // ---- Submit / verify ----------------------------------------------------
  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const code = getCode();
    if (code.length !== CODE_LENGTH) {
      showError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    verifyOtp();

    async function verifyOtp() {
      let response = await fetch(`${ROUTE.verifyOtpRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          otp_code: code,
          otp_token: document.querySelector('input[name="otp_token"]').value
        })
      });
      let result = await response.json();
      if (result.success) {
        showSuccess();
      } else{
        showError(result.message || 'Invalid OTP. Please try again.');
      }

    }
  });

  function setLoading(isLoading) {
    verifyBtn.classList.toggle('loading', isLoading);
    verifyBtn.disabled = isLoading;
    otpInputs.forEach((box) => (box.disabled = isLoading));
  }

  // new OTP request
  async function requestNewOtp() {
    let response = await fetch(ROUTE.resendNewOTPRoute, {
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
      otpInputs.forEach((box) => { box.disabled = false; });
      otpInputs[0].focus();
      Toastify({
        text: "New OTP sent successfully.",
        duration: 3000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
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

  // ---- Resend cooldown ------------------------------------------------------
  function startResendCooldown() {
    let remaining = RESEND_COOLDOWN_SECONDS;
    resendBtn.disabled = true;
    updateTimerLabel(remaining);

    resendInterval = setInterval(() => {
      remaining -= 1;
      updateTimerLabel(remaining);

      if (remaining <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        resendTimerEl.textContent = '';
      }
    }, 1000);
  }

  function updateTimerLabel(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    resendTimerEl.textContent = `(${m}:${s})`;
  }

  resendBtn.addEventListener('click', () => {
    if (resendBtn.disabled) return;
    otpInputs.forEach((box) => { box.value = ''; box.classList.remove('filled', 'error'); box.disabled = true; });
    clearError();
    otpInputs[0].focus();
    startResendCooldown();
    
    requestNewOtp();
  });


  // kick off initial cooldown on page load
  startResendCooldown();
}); 