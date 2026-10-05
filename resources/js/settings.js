/* ==========================================================================
   CHATIFY — settings.js
   Settings page behavior: left menu -> click -> right detail section.

   Mobile:
   - Menu item par tap -> `.settings-app.show-detail` lagti hai (detail slide-in).
   - Back arrow (#settingsBackBtn) aur browser/Android back button kaam karte hain.
   - Mobile navigation button (hamburger) hamesha nazar aata hai, is liye
     yahan `body.conversation-open` use nahi hoti.

   AJAX CALLS (4): har call ke upar comment hai jisme route, method,
   bheja jane wala data aur expected JSON response likha hai.
   Baqi sab kuch SETTINGS_ROUTES se control hota hai — sirf wahan routes set karein.

   "More settings" ke toggles koi AJAX call nahi karte, ye browser ki
   localStorage me save hote hain (PREFS dekhein).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initBackButton();
    initPasswordToggles();
    initPasswordForm();
    initBlockedUsers();
    initPreferences();
    initLogout();
});

// Routes — apne Laravel routes ke hisaab se yahan adjust kar lein.
const SETTINGS_ROUTES = {
    updatePassword: `/settings/password`,
    blockedList: `/settings/blocked`,
    unblockUser: `/settings/blocked/unblock`,
    logout: `/logout`,
};

const mobileMQ = window.matchMedia('(max-width: 767.98px)');

const settingsAppEl = document.getElementById('settingsApp');
const settingsMenuEl = document.getElementById('settingsMenu');
const mobileTitleEl = document.getElementById('settingsMobileTitle');

let activeSection = 'account';
let blockedFetchToken = 0; // out-of-order blocked-list responses ignore karne ke liye

/* ==========================================================================
   HELPERS
   ========================================================================== */
function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function assetPath(path) {
    if (!path) return '';
    return `${window.storageUrl}/${path}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function toast(text, type = 'success') {
    if (typeof Toastify === 'undefined') {
        console.warn(text);
        return;
    }
    const isError = type === 'error';
    Toastify({
        text,
        duration: 1800,
        gravity: isError ? 'top' : 'bottom',
        position: isError ? 'right' : 'center',
        close: true,
        stopOnFocus: true,
        offset: isError ? { x: 0, y: 0 } : { x: 0, y: 50 },
        style: { background: isError ? '#e35d5d' : '#13B0A7', borderRadius: '8px', color: '#fff' },
    }).showToast();
}

// Sab AJAX calls isi se guzarti hain (headers + JSON parse ek jagah).
// Return: { ok, status, data }   (data = server ka JSON, khali object agar JSON na ho)
async function api(url, { method = 'POST', body } = {}) {
    const headers = {
        accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
    };
    if (body !== undefined) headers['content-type'] = 'application/json';

    const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
}

/* ==========================================================================
   MENU (left) -> SECTION (right) + mobile slide-in
   ========================================================================== */
function initMenu() {
    settingsMenuEl.querySelectorAll('.settings-menu-item').forEach((item) => {
        item.addEventListener('click', () => {
            openSection(item.dataset.section, true);
        });
    });
}

function openSection(name, updateHistory = true) {
    activeSection = name;

    settingsMenuEl.querySelectorAll('.settings-menu-item').forEach((i) => {
        i.classList.toggle('active', i.dataset.section === name);
    });
    document.querySelectorAll('.settings-section').forEach((s) => {
        s.classList.toggle('active', s.dataset.section === name);
    });

    const activeItem = settingsMenuEl.querySelector(`.settings-menu-item[data-section="${name}"]`);
    if (activeItem) mobileTitleEl.textContent = activeItem.dataset.title;

    // Blocked list jab bhi section khule, fresh load ho.
    if (name === 'blocked') loadBlockedUsers();

    if (mobileMQ.matches) {
        settingsAppEl.classList.add('show-detail');
        if (updateHistory) {
            history.pushState({ section: name, fromMenu: true }, '', location.href);
        }
    }
}

function closeDetail() {
    settingsAppEl.classList.remove('show-detail');
}

// Browser back/forward + Android hardware back button
window.addEventListener('popstate', (event) => {
    const section = event.state && event.state.section;
    if (section && mobileMQ.matches) {
        openSection(section, false);
        return;
    }
    closeDetail();
});

function initBackButton() {
    const backBtn = document.getElementById('settingsBackBtn');
    if (!backBtn) return;
    backBtn.addEventListener('click', () => {
        if (history.state && history.state.fromMenu) {
            history.back(); // popstate -> closeDetail()
        } else {
            closeDetail();
        }
    });
}

/* ==========================================================================
   PASSWORD — show / hide (eye icon). Koi AJAX call nahi.
   ========================================================================== */
function initPasswordToggles() {
    document.querySelectorAll('.st-pw-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            btn.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
        });
    });
}

/* ==========================================================================
   ACCOUNT — change password
   --------------------------------------------------------------------------
   AJAX CALL #1: Password update
   Route   : POST /settings/password            (SETTINGS_ROUTES.updatePassword)
   Body    : { current_password, password, password_confirmation }  (JSON)
   Success : { success: true, message: "Password updated." }
   Fail    : { success: false, message: "Current password is incorrect." }
   422     : { errors: { current_password: ["..."], password: ["..."] } }
             (Laravel validation ka default format — sab handle hota hai)
   Server par: Hash::check(current_password) karein, phir
               $user->update(['password' => Hash::make($request->password)]).
   ========================================================================== */
function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    const saveBtn = document.getElementById('passwordSaveBtn');
    if (!form) return;

    const setError = (name, msg) => {
        const errEl = form.querySelector(`.st-field-error[data-for="${name}"]`);
        if (errEl) {
            errEl.textContent = msg || '';
            errEl.closest('.st-field').classList.toggle('st-invalid', !!msg);
        }
    };
    const clearErrors = () => ['current_password', 'password', 'password_confirmation'].forEach((n) => setError(n, ''));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const current = form.current_password.value;
        const next = form.password.value;
        const confirm = form.password_confirmation.value;

        // Client-side check (server par bhi validation zaroor rakhein)
        let valid = true;
        if (!current) { setError('current_password', 'Enter your current password.'); valid = false; }
        if (next.length < 8) { setError('password', 'Use at least 8 characters.'); valid = false; }
        if (next !== confirm) { setError('password_confirmation', 'Passwords do not match.'); valid = false; }
        if (!valid) return;

        saveBtn.disabled = true;
        try {
            const { ok, status, data } = await api(SETTINGS_ROUTES.updatePassword, {
                body: { current_password: current, password: next, password_confirmation: confirm },
            });

            if (status === 422) {
                Object.entries(data.errors || {}).forEach(([key, msgs]) => setError(key, msgs[0]));
                toast('Fix the highlighted fields.', 'error');
                return;
            }
            if (!ok) {
                toast(data.message || 'Could not update password.', 'error');
                return;
            }
            form.reset();
            toast(data.message || 'Password updated.');
        } catch {
            toast('Something went wrong.', 'error');
        } finally {
            saveBtn.disabled = false;
        }
    });
}

/* ==========================================================================
   BLOCKED USERS (paginated: "Load more" button)
   --------------------------------------------------------------------------
   AJAX CALL #2: Blocked users ki list (ek page)
   Route   : GET /settings/blocked?page=1       (SETTINGS_ROUTES.blockedList)
   Body    : koi nahi (page query string me jata hai)
   Success : {
               success: true,
               users: [
                 { id: 9, name: "Sara Khan", user_name: "sara.k", avatar: "avatars/sara.jpg" | null },
                 ...
               ],
               total: 42,          // kul blocked users (count badge ke liye)
               next_page: 2 | null // null = aur pages nahi, "Load more" chhup jata hai
             }
   Fail    : { success: false, message: "..." }
   Server par: $request->user()->blockedUsers()->...->paginate(15) aur
               'total' => $users->total(),
               'next_page' => $users->hasMorePages() ? $users->currentPage() + 1 : null
               avatar ka path storage ke andar ka ho (assetPath() isko
               window.storageUrl ke sath jodta hai, jaise groups page me).

   AJAX CALL #3: Unblock
   Route   : POST /settings/blocked/unblock     (SETTINGS_ROUTES.unblockUser)
   Body    : { userId: 9 }  (JSON)
   Success : { success: true, message: "User unblocked." }
   Fail    : { success: false, message: "..." }
   Server par: $user->blockedUsers()->detach($request->userId)
   Note    : agar aur pages baaqi hon to unblock ke baad list page 1 se dobara
             load hoti hai (warna server par items shift hone se ek user
             skip ho sakta hai).
   ========================================================================== */
const blockedListEl = document.getElementById('blockedList');
const blockedLoadingEl = document.getElementById('blockedLoading');
const blockedEmptyEl = document.getElementById('blockedEmpty');
const blockedCountEl = document.getElementById('blockedCount');
const blockedMoreWrapEl = document.getElementById('blockedMoreWrap');
const blockedMoreBtn = document.getElementById('blockedMoreBtn');

let blockedNextPage = null; // null = aur pages nahi
let blockedTotal = 0;       // server ka kul count

function updateBlockedCount() {
    blockedCountEl.textContent = blockedTotal;
    blockedCountEl.hidden = blockedTotal === 0;
    blockedEmptyEl.hidden = blockedTotal > 0;
    blockedMoreWrapEl.hidden = blockedNextPage === null;
}

function setMoreLoading(isLoading) {
    blockedMoreBtn.disabled = isLoading;
    blockedMoreBtn.textContent = isLoading ? 'Loading...' : 'Load more';
}

function initBlockedUsers() {
    blockedMoreBtn.addEventListener('click', () => {
        if (blockedNextPage !== null) loadBlockedUsers(blockedNextPage);
    });
    // Page agar seedha blocked section se khule to bhi list load ho
    if (activeSection === 'blocked') loadBlockedUsers();
}

// page = 1: list naye sire se. page > 1: purani list ke neechay judti hai.
async function loadBlockedUsers(page = 1) {
    const token = ++blockedFetchToken;
    const append = page > 1;

    if (append) {
        setMoreLoading(true);
    } else {
        setMoreLoading(false);
        blockedListEl.innerHTML = '';
        blockedEmptyEl.hidden = true;
        blockedCountEl.hidden = true;
        blockedMoreWrapEl.hidden = true;
        blockedLoadingEl.hidden = false;
    }

    try {
        const { ok, data } = await api(`${SETTINGS_ROUTES.blockedList}?page=${page}`, { method: 'GET' });
        if (token !== blockedFetchToken) return; // naya request chal chuka hai
        blockedLoadingEl.hidden = true;
        setMoreLoading(false);

        if (!ok) {
            toast(data.message || 'Could not load blocked users.', 'error');
            return;
        }

        (data.users || []).forEach((user) => blockedListEl.appendChild(buildBlockedItem(user)));
        blockedTotal = data.total ?? blockedListEl.children.length;
        blockedNextPage = data.next_page ?? null;
        updateBlockedCount();
    } catch {
        if (token !== blockedFetchToken) return;
        blockedLoadingEl.hidden = true;
        setMoreLoading(false);
        toast('Could not load blocked users.', 'error');
    }
}

function buildBlockedItem(user) {
    const li = document.createElement('li');
    li.className = 'blocked-item';
    li.dataset.userId = user.id;

    const avatar = document.createElement('div');
    avatar.className = 'blocked-avatar';
    if (user.avatar) {
        const img = document.createElement('img');
        img.src = assetPath(user.avatar);
        img.alt = user.name;
        avatar.appendChild(img);
    } else {
        avatar.textContent = (user.name || '').trim().substring(0, 2).toUpperCase();
    }
    li.appendChild(avatar);

    const body = document.createElement('div');
    body.className = 'blocked-body';
    body.innerHTML = `<span class="blocked-name">${escapeHtml(user.name)}</span>`
        + (user.user_name ? `<span class="blocked-user-name">@${escapeHtml(user.user_name)}</span>` : '');
    li.appendChild(body);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'st-unblock-btn';
    btn.textContent = 'Unblock';
    btn.addEventListener('click', () => handleUnblock(user, li));
    li.appendChild(btn);

    return li;
}

function handleUnblock(user, li) {
    Swal.fire({
        title: `Unblock ${user.name}?`,
        text: 'They will be able to message you again.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e35d5d',
        cancelButtonColor: '#6b8280',
        confirmButtonText: 'Yes, unblock',
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        try {
            const { ok, data } = await api(SETTINGS_ROUTES.unblockUser, { body: { userId: user.id } });
            if (!ok) {
                toast(data.message || 'Could not unblock user.', 'error');
                return;
            }
            li.remove();
            blockedTotal = Math.max(0, blockedTotal - 1);

            if (blockedNextPage !== null) {
                loadBlockedUsers(1); // aur pages baaqi: page 1 se dobara (items shift hue)
            } else {
                updateBlockedCount();
            }
            toast(data.message || 'User unblocked.');
        } catch {
            toast('Could not unblock user.', 'error');
        }
    });
}

/* ==========================================================================
   MORE SETTINGS — toggles (browser ki localStorage me save). Koi AJAX nahi.
   --------------------------------------------------------------------------
   Har toggle ka HTML me `data-pref="<key>"` hota hai. Value localStorage me
   'on' ya 'off' save hoti hai.

   Naya toggle add karna ho to:
     1. Blade me ek `.st-toggle-row` copy karein, data-pref ka naam badlein.
     2. Neeche PREFS me us key ka default likh dein.
     3. Jahan use karna ho wahan localStorage.getItem('<key>') check karein
        (app.js me messageSound / soundInActiveChat aise hi use hote hain).

   Note: localStorage har browser/device par alag hoti hai, is liye ye
   settings sirf isi browser me lagu hongi.
   ========================================================================== */
const PREFS = {
    messageSound: 'on',        // naye message par sound
    soundInActiveChat: 'off',  // khuli chat me bhi sound
};

function readPref(key) {
    try {
        const v = localStorage.getItem(key);
        return v === 'on' || v === 'off' ? v : PREFS[key];
    } catch {
        return PREFS[key]; // localStorage blocked (private mode wagaira)
    }
}

function writePref(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function initPreferences() {
    document.querySelectorAll('input[data-pref]').forEach((input) => {
        const key = input.dataset.pref;
        input.checked = readPref(key) === 'on';

        input.addEventListener('change', () => {
            const saved = writePref(key, input.checked ? 'on' : 'off');
            if (!saved) {
                input.checked = !input.checked; // save nahi hua to wapas purani state
                toast('Could not save this setting in your browser.', 'error');
                return;
            }
            toast('Saved.');

            // Sound on karte hi ek baar preview baja do (user ko test bhi mil jata hai)
            if (key === 'messageSound' && input.checked) {
                const preview = new Audio('/sounds/message.mp3');
                preview.volume = 0.6;
                preview.play().catch(() => {});
            }
        });
    });
}

/* ==========================================================================
   ACCOUNT — logout
   --------------------------------------------------------------------------
   AJAX CALL #4: Logout
   Route   : POST /logout                        (SETTINGS_ROUTES.logout)
   Body    : koi nahi
   Success : { success: true, redirect: "/login" }   (redirect optional)
   Server par: Auth::logout(); session invalidate + regenerateToken().
               Agar aapka Laravel default /logout redirect (HTML) deta hai
               to bhi chalega — res.ok par hum /login par chale jate hain.
   ========================================================================== */
function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        Swal.fire({
            title: 'Log out?',
            text: 'You will need to sign in again.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#e35d5d',
            cancelButtonColor: '#6b8280',
            confirmButtonText: 'Yes, log out',
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            btn.disabled = true;
            try {
                const res = await fetch(SETTINGS_ROUTES.logout, {
                    method: 'POST',
                    headers: {
                        accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error();
                window.location.replace(data.redirect || '/signin'); // replace: back button se settings page wapas na aaye
            } catch {
                btn.disabled = false;
                toast('Could not log out. Try again.', 'error');
            }
        });
    });
}