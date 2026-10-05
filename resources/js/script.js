/* ==========================================================================
   CHATIFY — app.js
   Frontend-only interactions for the Welcome / Landing page.
   Functions are kept modular so backend logic (Laravel) can be dropped in
   later without restructuring the UI.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initNavButtons();
  resolveHeroTyping();
});

/**
 * Sets the current year in the footer copyright line.
 */
function setFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Wires up the Sign In / Create Account buttons.
 * These are placeholders — replace with real navigation
 * (e.g. window.location.href = '/login') once routes exist.
 */
function initNavButtons() {
  const signInTriggers = [
    document.getElementById('signInBtn'),
    document.getElementById('headerSignInBtn')
  ];
  const createAccountTriggers = [
    document.getElementById('createAccountBtn'),
    document.getElementById('headerCreateBtn')
  ];

  signInTriggers.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      showToast('Sign In page is next in the build queue', 'bi-arrow-right-circle');
      // TODO: window.location.href = 'signin.html';
    });
  });

  createAccountTriggers.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      showToast('Sign Up page is coming right after Sign In', 'bi-person-plus-fill');
      // TODO: window.location.href = 'signup.html';
    });
  });
}

/**
 * Simulates the third hero bubble receiving a message:
 * starts as a typing indicator, then resolves into real text.
 * Purely decorative — demonstrates the "message arriving" moment.
 */
function resolveHeroTyping() {
  const typingBubble = document.getElementById('typingBubble');
  if (!typingBubble) return;

  const resolvedMessage = "Perfect, can't wait!";
  const resolvedTime = '12:22 PM';

  setTimeout(() => {
    typingBubble.classList.remove('bubble-typing');
    typingBubble.innerHTML = `
      <p>${resolvedMessage}</p>
      <span class="bubble-time">${resolvedTime}</span>
    `;
  }, 2600);
}

/**
 * Reusable toast component for frontend-only feedback.
 * Used across Chatify pages for confirmations like
 * "Friend request sent" once wired to real actions.
 * @param {string} message
 * @param {string} iconClass - a Bootstrap Icons class, e.g. 'bi-check2'
 */
function showToast(message, iconClass = 'bi-check2') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'chatify-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<i class="bi ${iconClass}" aria-hidden="true"></i><span>${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}