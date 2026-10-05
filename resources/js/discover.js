/* ==========================================================================
   CHATIFY — discover.js (responsive/mobile-ready)
     1) Search box -> debounce -> AJAX -> paginated users (10 per page).
     2) "Show more" -> spinner -> next page -> append.
     3) Click a result -> profile panel opens -> AJAX profile fetch.
     4) "Add friend" button inside profile -> AJAX request.

   Mobile changes:
   - openProfile() / closeProfile() `.discover-app.show-profile` aur
     `body.conversation-open` (hamburger hide) toggle karte hain.
   - Back arrow (#discoverBackBtn) + browser/Android back button kaam karte hain.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSearchBox();
    initBackButton();
});

// Routes — apne Laravel routes ke hisaab se yahan adjust kar lein.
const DISCOVER_ROUTES = {
    search: `/discover/search`,                       // GET  ?query=...&page=1
    profile: (userId) => `/discover/profile/${userId}`, // GET
    addFriend: `/discover/friend/add`,                 // POST { userId }
};

const RESULTS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const mobileMQ = window.matchMedia('(max-width: 767.98px)');

const discoverAppEl = document.getElementById('discoverApp');
const discoverSearchWrap = document.getElementById('discoverSearchWrap');
const discoverSearchInput = document.getElementById('discoverSearchInput');
const discoverResultsEl = document.getElementById('discoverResults');
const discoverEmptyStateEl = document.getElementById('discoverEmptyState');
const discoverProfileLoadingEl = document.getElementById('discoverProfileLoading');
const discoverProfileEl = document.getElementById('discoverProfile');

let currentQuery = '';
let currentPage = 1;
let hasMorePages = false;
let searchDebounceTimer = null;
let activeSearchToken = 0;  // out-of-order search responses ignore karne ke liye
let activeProfileToken = 0; // out-of-order profile responses ignore karne ke liye
let activeUserId = null;

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function assetPath(path) {
    if (!path) return '';
    return `${window.storageUrl}/${path}`;
}

// Browser back/forward + Android hardware back button
window.addEventListener('popstate', (event) => {
    const userId = event.state && event.state.discoverProfile;
    if (userId) {
        const item = discoverResultsEl.querySelector(`.discover-item[data-user-id="${userId}"]`);
        if (item) {
            setActiveResultItem(item);
            openProfile(userId, false); // history dobara push nahi karni
            return;
        }
    }
    closeProfile();
});

/* ==========================================================================
   SEARCH BOX
   ========================================================================== */
function initSearchBox() {
    if (!discoverSearchInput) return;

    discoverSearchInput.addEventListener('input', () => {
        const term = discoverSearchInput.value.trim();

        clearTimeout(searchDebounceTimer);

        if (!term) {
            resetResults();
            return;
        }

        searchDebounceTimer = setTimeout(() => runSearch(term, 1), SEARCH_DEBOUNCE_MS);
    });
}

function resetResults() {
    activeSearchToken++; // input khali karne ke baad purani in-flight search ka result render na ho
    currentQuery = '';
    currentPage = 1;
    hasMorePages = false;
    discoverResultsEl.innerHTML = '';
    discoverSearchWrap.classList.remove('is-loading');
    discoverEmptyStateEl.hidden = true;
    renderHint('Type a name or username to start discovering people.');
}

function renderHint(text) {
    discoverResultsEl.innerHTML = `<li class="discover-hint">${escapeHtml(text)}</li>`;
}

function renderSkeletonRows(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
      <li class="discover-skeleton-row">
        <div class="sk-avatar"></div>
        <div class="sk-body">
          <div class="sk-line w60"></div>
          <div class="sk-line w35"></div>
        </div>
      </li>`;
    }
    discoverResultsEl.innerHTML = html;
}

/* ==========================================================================
   RUN SEARCH (page = 1 => fresh search, page > 1 => "show more")
   Expected JSON shape:
   {
     success: true,
     users: [
       { id: 7, hash: "abc123", name: "Ali Raza", username: "ali.raza", avatar: null | "avatars/x.jpg" }
     ],
     current_page: 1,
     has_more: true
   }
   ========================================================================== */
function runSearch(query, page) {
    const token = ++activeSearchToken;

    if (page === 1) {
        currentQuery = query;
        discoverSearchWrap.classList.add('is-loading');
        renderSkeletonRows();
    }

    const url = `${DISCOVER_ROUTES.search}?query=${encodeURIComponent(query)}&page=${page}&per_page=${RESULTS_PER_PAGE}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            // stale response se ignore karein agar user ne aagy type kr diya ho
            if (token !== activeSearchToken) return;

            discoverSearchWrap.classList.remove('is-loading');

            if (!data.success) {
                if (page === 1) renderHint(data.message || 'No result.');
                else {
                    restoreShowMoreButton(); // pehle poori list hint se replace ho jati thi
                    showToast(data.message || 'Could not load more.');
                }
                return;
            }

            currentPage = page; // sirf success par aage barhao, taake retry me page skip na ho
            hasMorePages = Boolean(data.has_more);

            if (page === 1) {
                discoverResultsEl.innerHTML = '';
                if (!data.users.length) {
                    renderHint('No users found matching your search.');
                    return;
                }
            }

            appendResultItems(data.users);
            renderShowMoreControl();
        })
        .catch(() => {
            if (token !== activeSearchToken) return;
            discoverSearchWrap.classList.remove('is-loading');
            if (page === 1) {
                renderHint('Something went wrong.');
            } else {
                restoreShowMoreButton(); // pehle button hamesha spinner me atka reh jata tha
                showToast('Something went wrong.');
            }
        });
}

function restoreShowMoreButton() {
    const btn = document.getElementById('showMoreBtn');
    if (!btn) return;
    btn.classList.remove('is-loading');
    btn.disabled = false;
}

function appendResultItems(users) {
    // remove any existing "show more" row before appending fresh items
    const existingShowMore = discoverResultsEl.querySelector('.show-more-wrap');
    if (existingShowMore) existingShowMore.remove();

    users.forEach((user) => discoverResultsEl.appendChild(buildResultItem(user)));
}

function buildResultItem(user) {
    const li = document.createElement('li');
    li.className = 'discover-item';
    li.dataset.userId = user.id;
    if (activeUserId !== null && String(activeUserId) === String(user.id)) li.classList.add('active');

    li.appendChild(buildAvatarNode(user.name, user.avatar ?? 'avatars/defaultChat.png', 'avatar'));

    const body = document.createElement('div');
    body.className = 'discover-item-body';

    const name = document.createElement('span');
    name.className = 'discover-item-name';
    name.textContent = user.name;
    body.appendChild(name);

    const username = document.createElement('span');
    username.className = 'discover-item-username';
    username.textContent = `@${user.username}`;
    body.appendChild(username);

    li.appendChild(body);

    li.addEventListener('click', () => {
        if (!li.classList.contains('active')) {
            setActiveResultItem(li);
            openProfile(user.id, true);
        }
    });

    return li;
}

function setActiveResultItem(item) {
    discoverResultsEl.querySelectorAll('.discover-item').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
}

/* ==========================================================================
   SHOW MORE
   ========================================================================== */
function renderShowMoreControl() {
    if (!hasMorePages) return;

    const wrap = document.createElement('li');
    wrap.className = 'show-more-wrap';
    wrap.innerHTML = `
    <button type="button" class="show-more-btn" id="showMoreBtn">
      <span class="btn-spinner"></span>
      <span class="btn-label">Show more</span>
    </button>`;
    discoverResultsEl.appendChild(wrap);

    document.getElementById('showMoreBtn').addEventListener('click', handleShowMoreClick);
}

function handleShowMoreClick(event) {
    const btn = event.currentTarget;
    if (btn.classList.contains('is-loading')) return;

    btn.classList.add('is-loading');
    btn.disabled = true;

    runSearch(currentQuery, currentPage + 1);
}

/* ==========================================================================
   PROFILE PANEL  (mobile: results <-> profile)
   Expected JSON shape:
   {
     success: true,
     user: {
       id: 7, hash: "abc123", name: "Ali Raza", username: "ali.raza",
       avatar: null | "avatars/x.jpg", bio: "Coffee & code." | null,
       friend_status: "none" | "pending" | "friends"
     }
   }
   ========================================================================== */
function openProfile(userId, updateHistory = true) {
    const token = ++activeProfileToken;
    activeUserId = userId;

    discoverAppEl.classList.add('show-profile');       // mobile: profile screen slide-in
    document.body.classList.add('conversation-open');  // mobile: hamburger hide (mobile-navigation css isi class ko dekhta hai)

    // Sirf mobile par history use hoti hai: list -> profile ek entry, switching par replace
    if (updateHistory && mobileMQ.matches) {
        const state = { discoverProfile: userId };
        if (history.state && history.state.discoverProfile) history.replaceState(state, '', location.href);
        else history.pushState(state, '', location.href);
    }

    discoverEmptyStateEl.hidden = true;
    discoverProfileEl.hidden = true;
    discoverProfileLoadingEl.hidden = false;

    fetch(DISCOVER_ROUTES.profile(userId), {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (token !== activeProfileToken) return; // user dusre profile / list par ja chuka hai
            discoverProfileLoadingEl.hidden = true;
            if (!data.success) {
                discoverEmptyStateEl.hidden = false;
                showToast(data.message || 'Error loading profile');
                return;
            }
            renderProfile(data.user);
        })
        .catch(() => {
            if (token !== activeProfileToken) return;
            discoverProfileLoadingEl.hidden = true;
            discoverEmptyStateEl.hidden = false;
            showToast('Something went wrong');
        });
}

function closeProfile() {
    activeProfileToken++; // in-flight profile response ignore ho
    activeUserId = null;

    // dobara usi user par tap kar sakein (click handler active par kuch nahi karta)
    discoverResultsEl.querySelectorAll('.discover-item.active').forEach((i) => i.classList.remove('active'));

    discoverAppEl.classList.remove('show-profile');
    document.body.classList.remove('conversation-open');

    const resetPanel = () => {
        if (activeUserId !== null) return; // is dauran koi aur profile khul gayi
        discoverProfileEl.hidden = true;
        discoverProfileLoadingEl.hidden = true;
        discoverEmptyStateEl.hidden = false;
    };
    // Mobile par slide-out animation poori hone do
    if (mobileMQ.matches) setTimeout(resetPanel, 380);
    else resetPanel();
}

function initBackButton() {
    const backBtn = document.getElementById('discoverBackBtn');
    if (!backBtn) return;
    backBtn.addEventListener('click', () => {
        if (history.state && history.state.discoverProfile) history.back(); // popstate -> closeProfile()
        else closeProfile();
    });
}

function renderProfile(user) {
    discoverProfileEl.innerHTML = '';
    discoverProfileEl.hidden = false;

    discoverProfileEl.appendChild(buildProfileHeader(user));
    discoverProfileEl.appendChild(buildBioSection(user));
    discoverProfileEl.appendChild(buildAddFriendSection(user));
}

function buildAvatarNode(name, avatarUrl, sizeClass) {
    const el = document.createElement('div');
    el.className = sizeClass;
    if (avatarUrl) {
        const img = document.createElement('img');
        img.src = assetPath(avatarUrl);
        img.alt = name;
        el.appendChild(img);
    } else {
        el.textContent = (name || '').trim().substring(0, 2).toUpperCase();
    }
    return el;
}

function buildProfileHeader(user) {
    const header = document.createElement('div');
    header.className = 'discover-profile-header';

    header.appendChild(buildAvatarNode(user.name, user.avatar ?? 'avatars/defaultChat.png', 'discover-avatar-large'));

    const name = document.createElement('h2');
    name.className = 'discover-profile-name';
    name.textContent = user.name;
    header.appendChild(name);

    const username = document.createElement('p');
    username.className = 'discover-profile-username';
    username.textContent = `@${user.username}`;
    header.appendChild(username);

    return header;
}

function buildBioSection(user) {
    const section = document.createElement('section');
    section.className = 'discover-section';

    const title = document.createElement('h3');
    title.className = 'discover-section-title';
    title.textContent = 'Bio';
    section.appendChild(title);

    const bio = document.createElement('p');
    bio.className = user.bio ? 'discover-bio-text' : 'discover-bio-text is-empty';
    bio.textContent = user.bio || 'This user has not added a bio yet.';
    section.appendChild(bio);

    return section;
}

function buildAddFriendSection(user) {
    const section = document.createElement('section');
    section.className = 'discover-section';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'addFriendBtn';
    btn.className = 'add-friend-btn';

    applyFriendButtonState(btn, user.friend_status);

    btn.addEventListener('click', () => handleAddFriend(user.id, btn));

    section.appendChild(btn);
    return section;
}

function applyFriendButtonState(btn, friendStatus) {
    btn.classList.remove('state-pending', 'state-friends', 'state-reconnect');
    btn.disabled = false;

    let label = 'Add Friend';
    let icon = 'bi-person-plus-fill';

    if (friendStatus === 'pending') {
        label = 'Request Sent';
        icon = 'bi-hourglass-split';
        btn.classList.add('state-pending');
        btn.disabled = true;
    } else if (friendStatus === 'friends') {
        label = 'Friends';
        icon = 'bi-person-check-fill';
        btn.classList.add('state-friends');
        btn.disabled = true;
    } else if (friendStatus === 'reconnect') {
        label = 'Reconnect';
        icon = 'bi-person-plus-fill';
        btn.classList.add('state-reconnect');
    }

    btn.innerHTML = `
    <span class="btn-spinner"></span>
    <i class="bi ${icon} btn-label"></i>
    <span class="btn-label">${label}</span>`;
}

/* ==========================================================================
   ADD FRIEND
   Expected JSON shape:
   { success: true, message: "Friend request sent.", friend_status: "pending" }
   ========================================================================== */
function handleAddFriend(userId, btn) {
    if (btn.disabled || btn.classList.contains('is-loading')) return;

    btn.classList.add('is-loading');
    btn.disabled = true;

    fetch(DISCOVER_ROUTES.addFriend, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({ userId }),
    })
        .then((response) => response.json())
        .then((data) => {
            btn.classList.remove('is-loading');

            if (!data.success) {
                btn.disabled = false;
                showToast(data.message || 'Error sending friend request.');
                return;
            }

            applyFriendButtonState(btn, data.friend_status || 'pending');

            Toastify({
                text: data.message || 'Friend request sent.',
                style: { background: '#13B0A7' },
                close: true,
                offset: { x: 0, y: 50 },
                position: 'center',
                gravity: 'bottom',
                duration: 1500,
            }).showToast();
        })
        .catch(() => {
            btn.classList.remove('is-loading');
            btn.disabled = false;
            showToast('Something went wrong.');
        });
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function showToast(text) {
    if (typeof Toastify === 'undefined') {
        console.warn(text);
        return;
    }
    Toastify({
        text: text,
        duration: 1500,
        gravity: 'top',
        position: 'right',
        close: true,
        stopOnFocus: true,
        style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
    }).showToast();
}