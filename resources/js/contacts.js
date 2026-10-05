/* ==========================================================================
   CHATIFY — contacts.js (responsive/mobile-ready)
   Contacts list + right-side profile panel behavior.

   Contact data is read straight from each .contact-item's data-bs-* attrs
   (rendered server-side by Laravel/Blade), so opening a profile needs no
   extra request. Only the action buttons (Chat / Block / Delete) hit the
   backend.

   Mobile changes:
   - openContactProfile() / closeContactProfile() `.contacts-app.show-profile`
     aur `body.conversation-open` (hamburger hide) toggle karte hain.
   - Back arrow (#closeProfileBtn) + browser/Android back button kaam karte hain.
   - Friend requests modal mobile par bottom sheet hai (CSS), us waqt bhi
     hamburger hide hota hai.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initContactList();
  initProfileActions();
  initFriendRequestsModal();
});

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    chatBtnEl.classList.remove('loading');
    enableActionBtn(chatBtnEl);
  }
});

// Currently open contact (null = nothing selected yet)
let activeContact = null;

const mobileMQ = window.matchMedia('(max-width: 767.98px)');

const contactsAppEl = document.getElementById('contactsApp');
const contactsListEl = document.getElementById('contactsList');
const contactSearchInputEl = document.getElementById('contactSearchInput');

const contactEmptyStateEl = document.getElementById('contactEmptyState');
const contactProfileEl = document.getElementById('contactProfile');
const closeProfileBtnEl = document.getElementById('closeProfileBtn');

const profileAvatarEl = document.getElementById('profileAvatar');
const profileNameEl = document.getElementById('profileName');
const profileUsernameEl = document.getElementById('profileUsername');
const profileEmailEl = document.getElementById('profileEmail');
const profilePhoneEl = document.getElementById('profilePhone');
const profileBioEl = document.getElementById('profileBio');

const chatBtnEl = document.getElementById('chatBtn');
const blockUnblockBtnEl = document.getElementById('blockUnblockBtn');
const deleteBtnEl = document.getElementById('deleteBtn');

// Routes — point these at your Laravel routes when you wire the AJAX up.
const ROUTES = {
  blockContact: `/contacts/block`,
  unBlockContact: `/contacts/unBlock`,
  deleteContact: `/contacts/delete`,
  startChat: `/chats/start`,
  showParticularChat: (chatHash) => `/chats/${chatHash}`,
  friendRequests: (page) => `/contacts/friend-requests?page=${page}`,
  respondFriendRequest: `/contacts/friend-requests/respond`, // accept/reject dono isi route se
};

// Browser back/forward + Android hardware back button
window.addEventListener('popstate', (event) => {
  const contactId = event.state && event.state.contactId;
  if (contactId) {
    const item = contactsListEl.querySelector(`.contact-item[data-bs-id="${contactId}"]`);
    if (item) {
      setActiveContactItem(item);
      openContactProfile(readContactData(item), false); // history dobara push nahi karni
      return;
    }
  }
  closeContactProfile();
});

function assetPath(path) {
  if (!path) return '';
  return `${window.storageUrl}/${path}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// enable action btns
function enableActionBtn(btn) {
  if (!btn) return;
  btn.classList.remove('disabled');
  btn.disabled = false;
}
function disableActionBtn(btn) {
  if (!btn) return;
  btn.classList.add('disabled');
  btn.disabled = true;
}
function setBlockUnblockBtn(status) {
  const spanEl = blockUnblockBtnEl.querySelector('span');
  const icon = blockUnblockBtnEl.querySelector('i');
  // FIXED: pehle classList.add hota tha, to block/unblock baar baar karne par
  // dono icon classes ek sath chadh jati thi. Ab poori className set hoti hai.
  if (status === 'added') {
    blockUnblockBtnEl.setAttribute('data-action', 'block');
    spanEl.textContent = 'Block';
    icon.className = 'bi bi-slash-circle';
  } else {
    blockUnblockBtnEl.setAttribute('data-action', 'unBlock');
    spanEl.textContent = 'Unblock';
    icon.className = 'bi bi-plus-circle';
  }
}

// hamburger tab chhupao jab profile ya friend-requests sheet khuli ho
function syncConversationOpen() {
  const profileOpen = contactsAppEl.classList.contains('show-profile');
  const modalOpen = friendRequestsOverlayEl && !friendRequestsOverlayEl.hidden;
  document.body.classList.toggle('conversation-open', Boolean(profileOpen || modalOpen));
}

/* ==========================================================================
   CONTACTS LIST
   ========================================================================== */
function initContactList() {
  const items = document.querySelectorAll('.contact-item');

  items.forEach((item) => {
    item.addEventListener('click', () => {
      setActiveContactItem(item);
      openContactProfile(readContactData(item), true);
    });
  });

  contactSearchInputEl.addEventListener('input', () => {
    const term = contactSearchInputEl.value.trim().toLowerCase();
    items.forEach((item) => {
      const name = item.dataset.bsName.toLowerCase();
      const username = item.dataset.bsUsername.toLowerCase();
      const matches = name.includes(term) || username.includes(term);
      item.style.display = matches ? '' : 'none';
    });
  });

  closeProfileBtnEl.addEventListener('click', dismissProfile);
}

function setActiveContactItem(item) {
  document.querySelectorAll('.contact-item').forEach((i) => i.classList.remove('active'));
  item.classList.add('active');
}

// Pulls a plain object out of an item's data-bs-* attributes.
function readContactData(item) {
  return {
    id: item.dataset.bsId,
    name: item.dataset.bsName,
    username: item.dataset.bsUsername,
    email: item.dataset.bsEmail,
    phone: item.dataset.bsPhone,
    bio: item.dataset.bsBio,
    status: item.dataset.bsStatus,
    avatar: item.dataset.bsAvatar,
  };
}

/* ==========================================================================
   PROFILE PANEL  (mobile: list <-> profile)
   ========================================================================== */
function openContactProfile(contact, updateHistory = true) {
  activeContact = contact;

  contactsAppEl.classList.add('show-profile');   // mobile: profile screen slide-in
  syncConversationOpen();                        // mobile: hamburger hide

  // Sirf mobile par history use hoti hai: list -> profile ek entry
  if (updateHistory && mobileMQ.matches) {
    const state = { contactId: contact.id };
    if (history.state && history.state.contactId) history.replaceState(state, '', location.href);
    else history.pushState(state, '', location.href);
  }

  contactEmptyStateEl.hidden = true;
  contactProfileEl.hidden = false;
  contactProfileEl.scrollTop = 0;
  setBlockUnblockBtn(contact.status);

  renderProfileAvatar(profileAvatarEl, contact);
  profileNameEl.textContent = contact.name;
  profileUsernameEl.textContent = `@${contact.username}`;
  profileEmailEl.textContent = contact.email || 'Not provided';
  profilePhoneEl.textContent = contact.phone || 'Not provided';
  profileBioEl.textContent = contact.bio || 'No bio yet.';
}

// Back arrow / X / delete ke baad: mobile par history ke zariye wapas jao
// (popstate -> closeContactProfile), warna seedha band karo.
function dismissProfile() {
  if (mobileMQ.matches && history.state && history.state.contactId) history.back();
  else closeContactProfile();
}

function closeContactProfile() {
  activeContact = null;
  document.querySelectorAll('.contact-item.active').forEach((i) => i.classList.remove('active'));

  contactsAppEl.classList.remove('show-profile');
  syncConversationOpen();

  const resetPanel = () => {
    if (activeContact !== null) return; // is dauran koi aur profile khul gayi
    contactProfileEl.hidden = true;
    contactEmptyStateEl.hidden = false;
  };
  // Mobile par slide-out animation poori hone do
  if (mobileMQ.matches) setTimeout(resetPanel, 380);
  else resetPanel();
}

function renderProfileAvatar(el, contact) {
  if (contact.avatar) {
    el.innerHTML = '';
    const img = document.createElement('img');
    img.src = assetPath(contact.avatar);
    img.alt = contact.name;
    el.appendChild(img);
  } else {
    el.style.backgroundImage = '';
    el.style.background = contact.avatarColor || 'var(--primary-dark)';
    el.textContent = contact.initials;
  }
}

/* ==========================================================================
   PROFILE ACTIONS
   ========================================================================== */
function initProfileActions() {
  chatBtnEl.addEventListener('click', () => {
    if (!activeContact) return;
    startChatRequest(activeContact);
  });

  blockUnblockBtnEl.addEventListener('click', () => {
    if (!activeContact) return;
    const action = blockUnblockBtnEl.dataset.action;
    if (action === 'block') {
      Swal.fire({
        title: "Block this contact?",
        text: `Are you sure you want to block ${activeContact.name}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0d7d76",
        cancelButtonColor: "#e35d5d",
        confirmButtonText: "Block!"
      }).then((result) => {
        if (result.isConfirmed) {
          blockContactRequest(activeContact);
        }
      });
    } else {
      Swal.fire({
        title: "Unblock this contact?",
        text: `Are you sure you want to unblock ${activeContact.name}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0d7d76",
        cancelButtonColor: "#e35d5d",
        confirmButtonText: "unBlock!"
      }).then((result) => {
        if (result.isConfirmed) {
          unblockContactRequest(activeContact);
        }
      });
    }
  });

  deleteBtnEl.addEventListener('click', () => {
    if (!activeContact) return;
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0d7d76",
      cancelButtonColor: "#e35d5d",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        deleteContactRequest(activeContact);
      }
    });
  });
}

function startChatRequest(contact) {
  disableActionBtn(chatBtnEl);
  chatBtnEl.classList.add('loading');
  fetch(ROUTES.startChat, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'Content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      'contact': contact
    })
  }).then((res) => res.json()).then((data) => {
    window.location.href = ROUTES.showParticularChat(data.chat_hash);
    chatBtnEl.classList.remove('loading');
  }).catch((err) => {
    showToast('Could not open chat.');
    chatBtnEl.classList.remove('loading');
    enableActionBtn(chatBtnEl);
  });
}

function blockContactRequest(contact) {
  fetch(ROUTES.blockContact, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'Content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      contact: contact
    })
  }).then((response) => response.json())
    .then((result) => {
      if (result.success) {
        document.querySelector(`.contact-item[data-bs-id="${result.contact.contact_id}"]`)
          .setAttribute('data-bs-status', result.contact.status);
        Swal.fire({
          title: result.message,
          icon: 'success',
        });
        setBlockUnblockBtn(result.contact.status);
      } else {
        showToast(result.message || 'Could not block contact.');
      }
    })
    .catch(() => showToast('Could not block contact.'));
}

function unblockContactRequest(contact) {
  fetch(ROUTES.unBlockContact, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'Content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      contact: contact
    })
  }).then((response) => response.json())
    .then((result) => {
      if (result.success) {
        document.querySelector(`.contact-item[data-bs-id="${result.contact.contact_id}"]`)
          .setAttribute('data-bs-status', result.contact.status);
        Swal.fire({
          title: result.message,
          icon: 'success',
        });
        setBlockUnblockBtn(result.contact.status);
      } else {
        showToast(result.message || 'Could not unblock contact.');
      }
    })
    .catch(() => showToast('Could not unblock contact.'));
}

function deleteContactRequest(contact) {
  fetch(ROUTES.deleteContact, {
    method: 'POST',
    headers: {
      'Accept': 'Application/json',
      'Content-type': 'Application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      contact: contact
    })
  }).then((response) => response.json())
    .then((result) => {
      if (result.success) {
        removeContactFromList(contact.id);
        Swal.fire({
          text: result.message,
          icon: 'success'
        });
      } else {
        showToast(result.message || 'Could not delete contact.');
      }
    })
    .catch(() => showToast('Could not delete contact.')); // FIXED: was empty .catch()
}

function removeContactFromList(contactId) {
  const item = contactsListEl.querySelector(`[data-bs-id="${contactId}"]`);
  if (item) item.remove();
  dismissProfile(); // mobile par wapas list screen par
}

/* ==========================================================================
   TOAST HELPER
   ========================================================================== */
function showToast(text) {
  if (typeof Toastify === 'undefined') {
    console.warn(text);
    return;
  }
  Toastify({
    text,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    close: true,
    stopOnFocus: true,
    style: {
      background: '#13B0A7',
      borderRadius: '8px',
      color: '#fff',
    },
  }).showToast();
}

/* ==========================================================================
   FRIEND REQUESTS MODAL
   ========================================================================== */
let frCurrentPage = 1;
let frLastPage = 1;
let frIsLoading = false;

const friendRequestsBtnEl = document.getElementById('friendRequestsBtn');
const friendRequestsOverlayEl = document.getElementById('friendRequestsOverlay');
const closeFriendRequestsBtnEl = document.getElementById('closeFriendRequestsBtn');
const friendRequestsBodyEl = document.getElementById('friendRequestsBody');
const friendRequestsLoadingEl = document.getElementById('friendRequestsLoading');
const friendRequestsListEl = document.getElementById('friendRequestsList');
const friendRequestsEmptyEl = document.getElementById('friendRequestsEmpty');
const friendRequestsLoadingMoreEl = document.getElementById('friendRequestsLoadingMore');

function initFriendRequestsModal() {
  // Guard: agar modal markup page pe present nahi hai to silently skip
  if (!friendRequestsBtnEl || !friendRequestsOverlayEl || !friendRequestsListEl) return;

  friendRequestsBtnEl.addEventListener('click', openFriendRequestsModal);
  closeFriendRequestsBtnEl.addEventListener('click', closeFriendRequestsModal);

  friendRequestsOverlayEl.addEventListener('click', (e) => {
    if (e.target === friendRequestsOverlayEl) closeFriendRequestsModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !friendRequestsOverlayEl.hidden) closeFriendRequestsModal();
  });

  // Scroll se agla page (pagination) load karna
  friendRequestsBodyEl.addEventListener('scroll', () => {
    const nearBottom =
      friendRequestsBodyEl.scrollTop + friendRequestsBodyEl.clientHeight >=
      friendRequestsBodyEl.scrollHeight - 60;

    if (nearBottom && !frIsLoading && frCurrentPage < frLastPage) {
      frCurrentPage += 1;
      fetchFriendRequests(frCurrentPage);
    }
  });

  // Event delegation — list ke andar kisi bhi accept/reject btn pr click
  friendRequestsListEl.addEventListener('click', (e) => {
    const acceptBtn = e.target.closest('.fr-accept-btn');
    const rejectBtn = e.target.closest('.fr-reject-btn');
    if (!acceptBtn && !rejectBtn) return;

    const row = e.target.closest('.friend-request-item');
    const requestId = row.dataset.bsId;
    const action = acceptBtn ? 'accept' : 'reject';
    const clickedBtn = acceptBtn || rejectBtn;

    respondToFriendRequest(row, requestId, action, clickedBtn);
  });
}

function openFriendRequestsModal() {
  // Reset state — har baar fresh open pr pehle page se load ho
  frCurrentPage = 1;
  frLastPage = 1;
  friendRequestsListEl.innerHTML = '';
  friendRequestsListEl.hidden = true;
  friendRequestsEmptyEl.hidden = true;
  friendRequestsLoadingMoreEl.hidden = true;
  friendRequestsLoadingEl.hidden = false;

  friendRequestsOverlayEl.hidden = false;
  syncConversationOpen(); // mobile: sheet ke neeche hamburger na aaye

  fetchFriendRequests(1);
}

function closeFriendRequestsModal() {
  friendRequestsOverlayEl.hidden = true;
  syncConversationOpen();
}

function fetchFriendRequests(page) {
  frIsLoading = true;
  if (page > 1) friendRequestsLoadingMoreEl.hidden = false;

  fetch(ROUTES.friendRequests(page), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    },
  })
    .then((res) => res.json())
    .then((result) => {
      const requests = result.data || [];
      frCurrentPage = result.current_page || page;
      frLastPage = result.last_page || 1;

      friendRequestsLoadingEl.hidden = true;
      friendRequestsLoadingMoreEl.hidden = true;

      if (page === 1 && requests.length === 0) {
        friendRequestsEmptyEl.hidden = false;
        friendRequestsListEl.hidden = true;
        return;
      }

      friendRequestsListEl.hidden = false;
      requests.forEach((req) => appendFriendRequestItem(req));
    })
    .catch(() => {
      friendRequestsLoadingEl.hidden = true;
      friendRequestsLoadingMoreEl.hidden = true;
      showToast('Could not load friend requests.');
    })
    .finally(() => {
      frIsLoading = false;
    });
}

function appendFriendRequestItem(req) {
  const li = document.createElement('li');
  li.className = 'friend-request-item';
  li.setAttribute('data-bs-id', req.id);

  // name / username ab escape hote hain (pehle seedha innerHTML me ja rahe the)
  li.innerHTML = `
    <span class="avatar"><img src="${assetPath(req.avatar)}" alt=""></span>
    <div class="friend-request-item-body">
      <span class="friend-request-item-name">${escapeHtml(req.name)}</span>
      <span class="friend-request-item-username">@${escapeHtml(req.user_name)}</span>
    </div>
    <div class="fr-item-actions">
      <button type="button" class="fr-action-btn fr-accept-btn" title="Accept" aria-label="Accept">
        <i class="bi bi-check-lg"></i>
      </button>
      <button type="button" class="fr-action-btn fr-reject-btn" title="Reject" aria-label="Reject">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  `;

  friendRequestsListEl.appendChild(li);
}

function respondToFriendRequest(row, requestId, action, clickedBtn) {
  // Dono buttons disable + sirf clicked wale pr spinner
  const allBtns = row.querySelectorAll('.fr-action-btn');
  allBtns.forEach((b) => b.disabled = true);
  row.classList.add('fr-row-busy');
  clickedBtn.classList.add('loading');

  fetch(ROUTES.respondFriendRequest, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    },
    body: JSON.stringify({
      request_id: requestId,
      action: action, // 'accept' | 'reject'
    }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        const message = result.message || (action === 'accept'
          ? 'Friend request accepted.'
          : 'Friend request rejected.');

        Toastify({
          text: message,
          style: {
            background: '#13B0A7',
          },
          close: true,
          offset: { x: 0, y: 50 },
          position: 'center',
          gravity: 'bottom',
          duration: 1500
        }).showToast();

        row.remove();

        // Agar list khali ho gayi to empty state dikhao
        if (!friendRequestsListEl.querySelector('.friend-request-item')) {
          friendRequestsListEl.hidden = true;
          friendRequestsEmptyEl.hidden = false;
        }
      } else {
        showToast(result.message || 'Something went wrong.');
        allBtns.forEach((b) => b.disabled = false);
        row.classList.remove('fr-row-busy');
        clickedBtn.classList.remove('loading');
      }
    })
    .catch(() => {
      Toastify({
        text: 'Could not process request.',
        duration: 1500,
        gravity: 'top',
        position: 'right',
        close: true,
        stopOnFocus: true,
        style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
      }).showToast();
      allBtns.forEach((b) => b.disabled = false);
      row.classList.remove('fr-row-busy');
      clickedBtn.classList.remove('loading');
    });
}