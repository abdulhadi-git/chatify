/* ==========================================================================
   CHATIFY — chats.js (combined, responsive/mobile-ready)
   1) Core chat behavior (chat list, messages fetch/render, load-older via
      before_id cursor, send message, file upload/download).
   2) Message-level actions add-on (Edit / Delete / Info).

   Mobile changes:
   - openChat() / closeChat() ab `.chat-app.show-conversation` aur
     `body.conversation-open` toggle karte hain (CSS slide + hamburger hide).
   - Back button (#chatBackBtn) + browser/hardware back (popstate) sahi chalta hai.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initChatList();
  initBackButton();
  requestForParticularChat();
  initLoadOlderMessages();
  if (typeof window.hideNavChatDot === 'function') window.hideNavChatDot();
});

const messagesForm = `<form class="chat-input-bar" id="chatInputForm">
          <button type="button" class="icon-btn" id="attachBtn" title="Attach file">
            <i class="bi bi-paperclip"></i>
          </button>
          <input type="file" id="fileInput" hidden>

          <button type="button" class="icon-btn" id="emojiBtn" title="Emoji">
            <i class="bi bi-emoji-smile"></i>
          </button>

          <input type="text" id="messageInput" class="chat-text-input" placeholder="Type a message" autocomplete="off">

          <button type="submit" class="icon-btn send-btn" id="sendBtn" title="Send">
            <i class="bi bi-send-fill"></i>
          </button>
        </form>`;
const loadMoreMessagesBtn = `<div class="load-older-messages" id="loadOlderMessages" hidden>
            <button type="button" class="load-older-btn" id="loadOlderBtn">
              <i class="bi bi-arrow-up-circle"></i>
              <span>Load older messages</span>
            </button>
            <div class="load-older-loading" id="loadOlderLoading" hidden>
              <div class="chat-loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>`;

const mobileMQ = window.matchMedia('(max-width: 767.98px)');

// Chat item (li) se openChat() ke liye data object banata hai
function chatDataFromItem(item) {
  return {
    id: item.dataset.chatId,
    name: item.dataset.name,
    status: item.dataset.status,
    chatHash: item.dataset.chatHash,
    chatStatus: item.dataset.chatStatus,
    createdBy: item.dataset.createdBy,
    contactStatus: item.dataset.contactStatus,
    avatar: item.dataset.avatar,
  };
}

// check if request is for particular chat (direct URL /chats/{hash})
function requestForParticularChat() {
  const url = window.location.pathname.split('/').filter(Boolean);
  if (url.length > 1) {
    const query = url.pop();
    const item = document.querySelector(`.chat-item[data-chat-hash="${query}"]`);
    if (!item) return;
    openChat(chatDataFromItem(item), 'replace');
  }
}

// Browser back/forward + Android hardware back button
window.addEventListener('popstate', function (event) {
  const hash = event.state && event.state.chatHash;
  if (hash) {
    const item = document.querySelector(`.chat-item[data-chat-hash="${hash}"]`);
    if (item) {
      openChat(chatDataFromItem(item), 'none'); // history dobara push nahi karni
      return;
    }
  }
  chatHistoryPushed = false;
  closeChat();
});

// Currently open chat (null = nothing selected yet)
let activeChatId = null;

// Simple in-memory counter to fake unique ids for optimistic messages
let tempMsgCounter = 0;

// true = is session me humne khud history.pushState kiya hai (back button history.back() kare)
let chatHistoryPushed = false;
const chatsHomeUrl = '/' + (window.location.pathname.split('/').filter(Boolean)[0] || 'chats');

const chatAppEl = document.getElementById('chatApp');
const chatMessagesEl = document.getElementById('chatMessages');
const chatEmptyStateEl = document.getElementById('chatEmptyState');
const chatConversationEl = document.getElementById('chatConversation');
const chatLoadingEl = document.getElementById('chatLoading');

const activeChatAvatarEl = document.getElementById('activeChatAvatar');
const activeChatNameEl = document.getElementById('activeChatName');
const activeChatStatusEl = document.getElementById('activeChatStatus');
const inputArea = document.getElementById('input-area');
let msgFile;

/* ==========================================================================
   MESSAGES — "load older" (cursor / before_id based) state
   ========================================================================== */
let currentChatHash = null;
let hasMoreMessages = false;
let isLoadingOlderMessages = false;

// Nothing selected on first load — show the empty state.
chatConversationEl.hidden = true;
chatEmptyStateEl.hidden = false;

// Routes — point these at your Laravel routes.
const ROUTES = {
  chatMessages: (chatHash) => `/chats/messages/${chatHash}`,
  loadMoreMessages: (chatHash) => `/chats/messages/${chatHash}/load-more`,
  sendMessage: `/chats/messages/send`,
  editMessage: `/chats/messages/edit`,
  deleteMessage: `/chats/messages/delete`,
  uploadFile: `/chats/send/attachments`,
  downloadFile: `/chats/download/attachments`,
  loadMoreChats: `/chats/load-more`,
  lastMessage: `/chats/messages/last-msg`,
  messageInfo: `/chats/messages/info`
};

/* ==========================================================================
   CHAT LIST — infinite scroll "load more"
   ========================================================================== */
let chatListPage = 2;      // page 1 already server-rendered
let chatListLoading = false;
let chatListHasMore = true;

function initChatListPagination() {
  const listEl = document.querySelector('.chat-list');
  if (!listEl) return;

  listEl.addEventListener('scroll', () => {
    const nearBottom = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 60;
    if (nearBottom) loadMoreChats();
  });
}

function loadMoreChats() {
  if (chatListLoading || !chatListHasMore) return;
  chatListLoading = true;
  showChatListLoader(true);

  fetch(`${ROUTES.loadMoreChats}?page=${chatListPage}`, {
    headers: {
      'accept': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      showChatListLoader(false);
      if (!data.success) {
        chatListLoading = false;
        return;
      }

      const listEl = document.querySelector('.chat-list');
      listEl.insertAdjacentHTML('beforeend', data.html);

      // naye append huay items par click listeners lagayen
      const newItems = listEl.querySelectorAll('.chat-item:not([data-bound])');
      bindChatItemEvents(newItems);

      chatListHasMore = data.hasMore;
      chatListPage++;
      chatListLoading = false;
    })
    .catch(() => {
      showChatListLoader(false);
      chatListLoading = false;
    });
}

function showChatListLoader(show) {
  let loader = document.getElementById('chatListLoader');
  if (!loader) {
    loader = document.createElement('li');
    loader.id = 'chatListLoader';
    loader.className = 'chat-list-loader';
    loader.innerHTML = `<div class="chat-loading-dots"><span></span><span></span><span></span></div>`;
    document.querySelector('.chat-list').appendChild(loader);
  }
  loader.hidden = !show;
  if (show) document.querySelector('.chat-list').appendChild(loader); // hamesha end pe rahe
}

// Item-click logic helper — naye load huay items par bhi reuse hota hai
function bindChatItemEvents(items) {
  items.forEach((item) => {
    item.setAttribute('data-bound', 'true');
    item.addEventListener('click', () => {
      if (item.classList.contains('active')) return;
      openChat(chatDataFromItem(item), 'push');
    });
  });
}

function markChatItemActive(chatId) {
  document.querySelectorAll('.chat-item').forEach((i) => {
    i.classList.toggle('active', i.dataset.chatId === String(chatId));
  });
  const activeItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
  const badge = activeItem && activeItem.querySelector('.chat-item-unread');
  if (badge) {
    badge.hidden = true;
    badge.textContent = '0';
  }
}

// Chat item ko list mein top par smoothly le aata hai (FLIP animation)
function moveChatItemToTop(chatId) {
  const listEl = document.querySelector('.chat-list');
  const item = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
  if (!listEl || !item) return;

  const firstItem = listEl.querySelector('.chat-item');
  if (firstItem === item) return; // already top par hai

  const first = item.getBoundingClientRect();

  listEl.insertBefore(item, firstItem);

  const last = item.getBoundingClientRect();
  const deltaY = first.top - last.top;
  if (!deltaY) return;

  item.style.transition = 'none';
  item.style.transform = `translateY(${deltaY}px)`;

  requestAnimationFrame(() => {
    item.style.transition = 'transform 300ms ease';
    item.style.transform = '';
  });

  item.addEventListener('transitionend', function handler() {
    item.style.transition = '';
    item.style.transform = '';
    item.removeEventListener('transitionend', handler);
  });
}

function initChatList() {
  bindChatItemEvents(document.querySelectorAll('.chat-item'));
  initChatListPagination();

  const searchInput = document.getElementById('chatSearchInput');
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('.chat-item').forEach((item) => {
      const name = item.dataset.name.toLowerCase();
      item.style.display = name.includes(term) ? '' : 'none';
    });
  });
}

function stopListeningMsgUpdateOrDeleteStatus(prevChatId) {
  if (prevChatId !== null) Echo.leave(`Chat.${prevChatId}`);
}

/* ==========================================================================
   OPEN / CLOSE CHAT  (mobile: list <-> conversation)
   historyMode: 'push' (user ne click kiya) | 'replace' (direct URL) | 'none' (popstate)
   ========================================================================== */
function openChat(chat, historyMode = 'push') {
  activeChatId = chat.id;
  window.activeChatId = activeChatId;
  inputArea.innerHTML = '';

  markChatItemActive(chat.id);

  chatEmptyStateEl.hidden = true;
  chatConversationEl.hidden = false;
  chatAppEl.classList.add('show-conversation');   // mobile: conversation screen slide-in
  document.body.classList.add('conversation-open'); // mobile: hamburger hide

  activeChatAvatarEl.innerHTML = `<img src="${chat.avatar}" alt="">`;
  activeChatNameEl.textContent = chat.name;
  activeChatStatusEl.textContent = chat.status;

  if (chat.chatStatus === 'inactive') {
    inputArea.innerHTML = ` <p class="chat-disabled-notice">
        <i class="bi bi-slash-circle"></i>
        Can not send messages in this chat.
    </p>`;
  } else {
    inputArea.innerHTML = messagesForm;
    initMessageForm();
    initFileUpload();
  }

  fetchChatMessages(chat.chatHash, historyMode);
}

function closeChat() {
  stopListeningMsgUpdateOrDeleteStatus(activeChatId);
  activeChatId = null;
  window.activeChatId = null;
  currentChatHash = null;
  hasMoreMessages = false;
  isLoadingOlderMessages = false;

  // floating action panels (body me append hote hain) saaf karo
  document.querySelectorAll('.msg-actions-panel').forEach((p) => p.remove());

  // Dobara usi chat par tap kar sakein (bindChatItemEvents active par return karta hai)
  document.querySelectorAll('.chat-item.active').forEach((i) => i.classList.remove('active'));

  chatAppEl.classList.remove('show-conversation');
  document.body.classList.remove('conversation-open');

  const resetView = () => {
    if (activeChatId !== null) return; // is dauran koi aur chat khul gayi
    chatConversationEl.hidden = true;
    chatEmptyStateEl.hidden = false;
    inputArea.innerHTML = '';
  };
  // Mobile par slide-out animation poori hone do, phir content hatao
  if (mobileMQ.matches) setTimeout(resetView, 380);
  else resetView();
}

function initBackButton() {
  const backBtn = document.getElementById('chatBackBtn');
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (chatHistoryPushed) {
      history.back(); // popstate -> closeChat()
    } else {
      closeChat();
      history.replaceState(null, '', chatsHomeUrl);
    }
  });
}

/* ==========================================================================
   LOAD MESSAGES — initial (latest) batch
   ========================================================================== */
// Naye chat par switch karte hi purani chat ke messages hata dete hain.
// #loadOlderMessages ko destroy nahi karte — detach, hide, wapas jod dete hain.
function clearMessagesView() {
  const loaderEl = document.getElementById('loadOlderMessages');
  chatMessagesEl.innerHTML = '';
  if (loaderEl) {
    loaderEl.hidden = true;
    chatMessagesEl.appendChild(loaderEl);
  }
}

function fetchChatMessages(chatHash, historyMode = 'push') {
  currentChatHash = chatHash;
  hasMoreMessages = false;
  isLoadingOlderMessages = false;
  showLoadOlderLoading(false);

  clearMessagesView();
  chatLoadingEl.hidden = false;

  const newUrl = ROUTES.chatMessages(chatHash);
  if (historyMode === 'push') {
    history.pushState({ chatHash: chatHash }, '', newUrl);
    chatHistoryPushed = true;
  } else if (historyMode === 'replace') {
    history.replaceState({ chatHash: chatHash }, '', newUrl);
  }

  fetch(ROUTES.chatMessages(chatHash), {
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      'X-SOCKET-ID': window.Echo.socketId()
    },
    method: 'GET',
  }).then((response) => response.json())
    .then((data) => {
      if (chatHash !== currentChatHash) return; // user is dauran dusri chat / list par chala gaya
      handleMessagesResponse(data, false); // false = fresh load, not prepend
      chatLoadingEl.hidden = true;
    })
    .catch(() => {
      if (chatHash !== currentChatHash) return;
      chatLoadingEl.hidden = true;
      notify('Could not load messages.');
    });
}

function handleMessagesResponse(result, isPrepend) {
  if (!result.success) {
    notify(result.message || 'Could not load messages.');
    return;
  }
  if (result.messages.length === 0) {
    // Older messages me kuch nahi mila — chat ko "No messages yet" se replace NA karo
    if (isPrepend) {
      hasMoreMessages = false;
      updateLoadOlderButton();
      return;
    }
    const loaderEl = document.getElementById('loadOlderMessages');
    chatMessagesEl.innerHTML = `<div class="chat-no-messages" id="chatNoMessages">
  <div class="chat-no-messages-icon">
    <i class="bi bi-chat-heart"></i>
  </div>
  <h3 class="chat-no-messages-title">No messages yet</h3>
  <p class="chat-no-messages-text">
    <span class="wave-hand">👋</span> Say hi and start the conversation
  </p>
</div>`;
    if (loaderEl) {
      loaderEl.hidden = true;
      chatMessagesEl.appendChild(loaderEl);
    }
    hasMoreMessages = false;
    return;
  }

  hasMoreMessages = !!result.hasMore;

  if (isPrepend) {
    prependMessageGroups(result.messages);
  } else {
    renderMessageGroups(result.messages);
    scrollMessagesToBottom();
  }

  updateLoadOlderButton();
}

/* ==========================================================================
   RENDER MESSAGES — grouped by date, WhatsApp style
   ========================================================================== */
function renderMessageGroups(messages) {
  const loaderEl = document.getElementById('loadOlderMessages');

  chatMessagesEl.innerHTML = '';
  if (loaderEl) chatMessagesEl.appendChild(loaderEl); // hamesha top pe rakho

  if (!messages || messages.length === 0) return;

  const groups = groupMessagesByDate(messages);
  Object.keys(groups).forEach((dateLabel) => {
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.textContent = dateLabel;
    chatMessagesEl.appendChild(divider);
    groups[dateLabel].forEach((msg) => {
      chatMessagesEl.appendChild(buildMessageBubble(msg));
    });
  });
}

/* ==========================================================================
   LOAD OLDER MESSAGES — cursor (before_id) based
   ========================================================================== */
function prependMessageGroups(messages) {
  if (!messages || messages.length === 0) return;

  const loaderEl = document.getElementById('loadOlderMessages');
  const referenceNode = loaderEl ? loaderEl.nextSibling : chatMessagesEl.firstChild;

  const firstExistingDivider = referenceNode && referenceNode.classList && referenceNode.classList.contains('date-divider')
    ? referenceNode
    : null;

  const fragment = document.createDocumentFragment();
  const groups = groupMessagesByDate(messages);
  const dateLabels = Object.keys(groups);

  dateLabels.forEach((dateLabel, idx) => {
    const isLastGroup = idx === dateLabels.length - 1;
    const skipDivider = isLastGroup && firstExistingDivider && firstExistingDivider.textContent === dateLabel;

    if (!skipDivider) {
      const divider = document.createElement('div');
      divider.className = 'date-divider';
      divider.textContent = dateLabel;
      fragment.appendChild(divider);
    }
    groups[dateLabel].forEach((msg) => fragment.appendChild(buildMessageBubble(msg)));
  });

  chatMessagesEl.insertBefore(fragment, referenceNode);
}

// Sabse purana message jo abhi DOM me hai — cursor
function getOldestMessageId() {
  const firstBubble = chatMessagesEl.querySelector('.msg-bubble[data-msg-id]');
  return firstBubble ? firstBubble.dataset.msgId : null;
}

function loadOlderMessages() {
  if (isLoadingOlderMessages || !hasMoreMessages || !currentChatHash) return;

  const beforeId = getOldestMessageId();
  if (!beforeId) return;

  const hashAtStart = currentChatHash;
  isLoadingOlderMessages = true;
  showLoadOlderLoading(true);

  // Scroll position maintain karne ke liye height save karo
  const prevScrollHeight = chatMessagesEl.scrollHeight;
  const prevScrollTop = chatMessagesEl.scrollTop;

  fetch(`${ROUTES.loadMoreMessages(hashAtStart)}?before_id=${encodeURIComponent(beforeId)}`, {
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    method: 'GET',
  }).then((response) => response.json())
    .then((data) => {
      if (hashAtStart !== currentChatHash) { // chat badal chuki hai — result ignore
        return;
      }
      handleMessagesResponse(data, true); // true = prepend

      const newScrollHeight = chatMessagesEl.scrollHeight;
      chatMessagesEl.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);

      isLoadingOlderMessages = false;
      showLoadOlderLoading(false);
    })
    .catch(() => {
      if (hashAtStart !== currentChatHash) return;
      isLoadingOlderMessages = false;
      showLoadOlderLoading(false);
      notify('Could not load older messages.');
    });
}

function updateLoadOlderButton() {
  const el = document.getElementById('loadOlderMessages');
  if (!el) return;
  el.hidden = !hasMoreMessages;
}

function showLoadOlderLoading(show) {
  const btn = document.getElementById('loadOlderBtn');
  const loading = document.getElementById('loadOlderLoading');
  if (btn) btn.hidden = show;
  if (loading) loading.hidden = !show;
}

function initLoadOlderMessages() {
  const btn = document.getElementById('loadOlderBtn');
  if (!btn) return;
  btn.addEventListener('click', loadOlderMessages);
}

function groupMessagesByDate(messages) {
  const groups = {};
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
}

function formatDateLabel(isoDate) {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function buildMessageBubble(msg) {
  const wrap = document.createElement('div');
  wrap.className = `msg-bubble ${msg.sender_id === window.AUTH_ID ? 'outgoing actionable' : 'incoming'}`;
  wrap.dataset.msgId = msg.id;

  if (msg.type !== 'text') {
    wrap.appendChild(buildFileContent(msg));
  } else {
    const text = document.createElement('div');
    text.className = 'msg-text';
    text.textContent = msg.message;
    wrap.appendChild(text);
  }

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = `<span class="msg-time">${formatTime(msg.created_at)}</span>`;

  if (msg.sender_id === window.AUTH_ID) {
    const tick = document.createElement('i');
    tick.className = statusIconClass(msg.status);
    meta.appendChild(tick);
  }

  wrap.appendChild(meta);
  return wrap;
}

function buildFileContent(msg) {
  const row = document.createElement('a');
  row.className = 'msg-file';
  if (msg.file_path) {
    const isDownloaded = JSON.parse(localStorage.getItem('FILES_DOWNLOADED_OR_SEND')) || [];
    if (!isDownloaded.includes(msg.file_path)) {
      row.classList.add('not-download');
    }
  }
  row.setAttribute('data-download-path', msg.file_path);
  row.innerHTML = `
    <i class="bi bi-file-earmark-fill">
  <span class="dl-arrow"></span>
</i>
    <div>
      <div class="msg-file-name">${escapeHtml(msg.message || msg.file_name)}</div>
      <div class="msg-file-size">${formatFileSize(msg.file_size)}</div>
    </div>
  `;
  return row;
}

function statusIconClass(status) {
  if (status === 'seen') return 'bi bi-check2-all seen text-primary';
  if (status === 'delivered') return 'bi bi-check2-all';
  if (status === 'sent') return 'bi bi-check2';
  return 'bi bi-clock';
}

function scrollMessagesToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   SEND MESSAGE
   ========================================================================== */
function initMessageForm() {
  const form = document.getElementById('chatInputForm');
  const input = document.getElementById('messageInput');

  // Mobile keyboard khulne ke baad last message nazar aaye
  input.addEventListener('focus', () => {
    setTimeout(scrollMessagesToBottom, 300);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text || !activeChatId) return;

    const tempId = `temp-${++tempMsgCounter}`;
    appendOptimisticMessage(tempId, text);
    input.value = '';
    scrollMessagesToBottom();
    document.getElementById('chatNoMessages')?.remove();
    sendMessageRequest(activeChatId, text, tempId);
    // Mobile par send ke baad keyboard band na ho: focus input par hi rahe
    input.focus();
  });
}

function appendOptimisticMessage(tempId, text) {
  ensureTodayDivider();

  const msg = {
    id: tempId,
    message: text,
    type: 'text',
    sender_id: window.AUTH_ID,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const bubble = buildMessageBubble(msg);
  bubble.classList.add('pending');
  chatMessagesEl.appendChild(bubble);
}

function ensureTodayDivider() {
  const dividers = chatMessagesEl.querySelectorAll('.date-divider');
  const last = dividers.length ? dividers[dividers.length - 1] : null;
  if (last && last.textContent === 'Today') return;

  const divider = document.createElement('div');
  divider.className = 'date-divider';
  divider.textContent = 'Today';
  chatMessagesEl.appendChild(divider);
}

function sendMessageRequest(chatId, text, tempId) {
  fetch(ROUTES.sendMessage, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      'X-SOCKET-ID': window.Echo.socketId()
    },
    body: JSON.stringify({
      chatId: chatId,
      sender_id: window.AUTH_ID,
      message: text,
    })
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    handleSendMessageResponse(data, tempId);
  }).catch(() => markMessageFailed(tempId));
}

function handleSendMessageResponse(result, tempId) {
  const bubble = chatMessagesEl.querySelector(`[data-msg-id="${tempId}"]`);
  if (!bubble) return;

  if (!result.success) {
    markMessageFailed(tempId);
    return;
  }
  bubble.dataset.msgId = result.msg.id;
  document.dispatchEvent(new CustomEvent('chat:refresh-last-msg'));
  bubble.classList.remove('pending');
  const tick = bubble.querySelector('.msg-meta .bi');
  if (tick) tick.className = statusIconClass(result.status || 'sent');

  moveChatItemToTop(activeChatId);
}

function markMessageFailed(tempId) {
  const bubble = chatMessagesEl.querySelector(`[data-msg-id="${tempId}"]`);
  if (bubble) {
    bubble.classList.remove('pending');
    const tick = bubble.querySelector('.msg-meta .bi');
    if (tick) tick.className = 'bi bi-exclamation-circle';
  }
  notify('Message failed to send.');
}

/* ==========================================================================
   FILE UPLOAD
   ========================================================================== */
function initFileUpload() {
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');

  attachBtn.addEventListener('click', () => {
    if (!activeChatId) {
      notify('Select a chat first.');
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const tempId = `temp-file-${++tempMsgCounter}`;
    document.getElementById('chatNoMessages')?.remove();
    appendOptimisticFileMessage(tempId, file);
    scrollMessagesToBottom();

    uploadFileRequest(activeChatId, file, tempId);
    fileInput.value = '';
  });
}

function appendOptimisticFileMessage(tempId, file) {
  ensureTodayDivider();
  const msg = {
    id: tempId,
    type: 'file',
    file_name: file.name,
    file_size: file.size,
    sender_id: window.AUTH_ID,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const bubble = buildMessageBubble(msg);
  bubble.classList.add('pending');
  chatMessagesEl.appendChild(bubble);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadFileRequest(chatId, file, tempId) {
  const formData = new FormData();
  formData.append('chatId', chatId);
  formData.append('sender_id', window.AUTH_ID);
  formData.append('attachment', file);
  fetch(ROUTES.uploadFile, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: formData
  }).then((response) => {
    return response.json();
  }).then((data) => {
    if (data.success && data.file_path) {
      const filesDownloaded = JSON.parse(localStorage.getItem('FILES_DOWNLOADED_OR_SEND')) || [];
      filesDownloaded.push(data.file_path);
      localStorage.setItem('FILES_DOWNLOADED_OR_SEND', JSON.stringify(filesDownloaded));
    }
    handleSendMessageResponse(data, tempId);
  }).catch(() => markMessageFailed(tempId)); // mobile network fail par bubble pending me atka na rahe
}

function downloadFile(downloadPath) {
  const resetFileEl = () => {
    const el = document.querySelector(`.msg-file[data-download-path="${downloadPath}"]`);
    if (el) el.classList.remove('downloading');
    return el;
  };

  fetch(ROUTES.downloadFile, {
    method: 'POST',
    headers: {
      'accept': 'application/octet-stream , application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      downloadPath: downloadPath
    })
  }).then((response) => {
    if (!response.ok) throw new Error('Download failed');
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition && contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : 'downloaded_file';
    return response.blob().then((blob) => ({ blob, filename }));
  })
    .then(({ blob, filename }) => {
      resetFileEl();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      const filesDownloaded = JSON.parse(localStorage.getItem('FILES_DOWNLOADED_OR_SEND')) || [];
      if (!filesDownloaded.includes(downloadPath)) {
        filesDownloaded.push(downloadPath);
        localStorage.setItem('FILES_DOWNLOADED_OR_SEND', JSON.stringify(filesDownloaded));
      }
    }).catch((err) => {
      console.log(err);
      // pehle yahan "downloading" class lagi reh jati thi (pointer-events:none) -> file dobara click nahi hoti thi
      const el = resetFileEl();
      if (el) el.classList.add('not-download');
      notify('Could not download file.');
    });
}


(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const chatMessagesEl = document.getElementById('chatMessages');
    if (!chatMessagesEl) return;

    injectActionButtons(chatMessagesEl);

    // Naye bubbles render hon to 3-dot button khud lag jaye.
    const observer = new MutationObserver(() => injectActionButtons(chatMessagesEl));
    observer.observe(chatMessagesEl, { childList: true });

    // Single delegated click handler (file downloads, 3-dot button, menu, click outside).
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('chat:refresh-last-msg', () => lastMsgRequest());
    // Panel button se door na bhaage — scroll/resize par band kar do.
    chatMessagesEl.addEventListener('scroll', closeAllActionPanels);
    window.addEventListener('resize', closeAllActionPanels);
  }

  /* ------------------------------------------------------------------ */
  /* Inject the 3-dot button into any outgoing bubble that doesn't have  */
  /* one yet.                                                            */
  /* ------------------------------------------------------------------ */
  function injectActionButtons(chatMessagesEl) {
    const bubbles = chatMessagesEl.querySelectorAll('.msg-bubble.actionable:not([data-actions-ready])');
    bubbles.forEach((bubble) => {
      bubble.setAttribute('data-actions-ready', 'true');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'msg-actions-btn';
      btn.setAttribute('aria-label', 'Message actions');
      btn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
      bubble.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Click routing                                                       */
  /* ------------------------------------------------------------------ */
  function handleDocumentClick(e) {
    // --- File download ---
    const fileEl = e.target.closest('.msg-file');
    if (fileEl) {
      e.stopPropagation();
      const downloadPath = fileEl.dataset.downloadPath;
      if (downloadPath && downloadPath !== 'undefined') {
        fileEl.classList.add('downloading');
        fileEl.classList.remove('not-download');
        downloadFile(downloadPath);
      } else {
        Toastify({
          text: 'Error downloading file.',
          style: { background: '#e35d5d' },
          close: true,
          position: 'right',
          duration: 1500,
        }).showToast();
      }
      return;
    }

    // --- Message action menu (3-dot button) ---
    const actionsBtn = e.target.closest('.msg-actions-btn');
    const actionItem = e.target.closest('.msg-action-item');

    if (actionsBtn) {
      e.stopPropagation();
      const bubble = actionsBtn.closest('.msg-bubble');
      toggleActionPanel(bubble, actionsBtn);
      return;
    }

    if (actionItem) {
      e.stopPropagation();
      const panel = actionItem.closest('.msg-actions-panel');
      const msgId = panel.dataset.msgId;
      const bubble = document.querySelector(`.msg-bubble[data-msg-id="${cssEscape(msgId)}"]`);
      const action = actionItem.dataset.action;

      if (!bubble) {
        closeAllActionPanels();
        return;
      }

      closeAllActionPanels();

      if (action === 'edit') {
        openEditModal(bubble, msgId);
      } else if (action === 'delete-me') {
        confirmDeleteMessage(bubble, msgId, 'me');
      } else if (action === 'delete-everyone') {
        confirmDeleteMessage(bubble, msgId, 'everyone');
      } else if (action === 'view-info') {
        openInfoModal(bubble, msgId);
      }
      return;
    }

    // Click menu/button/modal ke bahar tha — open panel band karo.
    if (!e.target.closest('.msg-edit-overlay')) {
      closeAllActionPanels();
    }
  }

  function toggleActionPanel(bubble, btn) {
    const wasOpen = bubble.classList.contains('menu-open');
    closeAllActionPanels();
    if (wasOpen) return;

    // File messages (has .msg-file, no .msg-text) edit nahi ho sakte.
    const isFileMessage = !!bubble.querySelector('.msg-file') && !bubble.querySelector('.msg-text');

    const editItem = isFileMessage
      ? ''
      : '<button type="button" class="msg-action-item" data-action="edit">' +
      '<i class="bi bi-pencil"></i> Edit' +
      '</button>';

    const panel = document.createElement('div');
    panel.className = 'msg-actions-panel msg-actions-panel--floating';
    panel.dataset.msgId = bubble.dataset.msgId;
    panel.innerHTML =
      editItem +
      '<button type="button" class="msg-action-item" data-action="delete-me">' +
      '<i class="bi bi-trash"></i> Delete for me' +
      '</button>' +
      '<button type="button" class="msg-action-item danger" data-action="delete-everyone">' +
      '<i class="bi bi-trash-fill"></i> Delete for everyone' +
      '</button>' +
      '<button type="button" class="msg-action-item" data-action="view-info">' +
      '<i class="bi bi-info"></i> Info' +
      '</button>';

    // <body> me append hota hai taake scrollable #chatMessages usay clip na kare.
    document.body.appendChild(panel);
    positionFloatingPanel(panel, btn);

    bubble.classList.add('menu-open');
  }

  // Button ki real screen coordinates se panel place karta hai; jagah na ho to
  // upar flip karta hai aur viewport ke andar rakhta hai.
  function positionFloatingPanel(panel, btn) {
    const gap = 4;
    const edgeMargin = 8;
    const btnRect = btn.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    let top = btnRect.bottom + gap;
    if (top + panelRect.height > window.innerHeight - edgeMargin) {
      top = btnRect.top - panelRect.height - gap;
    }
    top = Math.max(edgeMargin, top);

    let left = btnRect.right - panelRect.width;
    left = Math.min(left, window.innerWidth - panelRect.width - edgeMargin);
    left = Math.max(edgeMargin, left);

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }

  function closeAllActionPanels() {
    document.querySelectorAll('.msg-actions-panel').forEach((panel) => panel.remove());
    document.querySelectorAll('.msg-bubble.menu-open').forEach((b) => b.classList.remove('menu-open'));
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  /* ------------------------------------------------------------------ */
  /* EDIT MODAL                                                          */
  /* ------------------------------------------------------------------ */
  function openEditModal(bubble, msgId) {
    const textEl = bubble.querySelector('.msg-text');
    const currentText = textEl ? textEl.textContent : '';

    const overlay = document.createElement('div');
    overlay.className = 'msg-edit-overlay';
    overlay.innerHTML =
      '<div class="msg-edit-modal">' +
      '<h3>Edit message</h3>' +
      '<textarea class="msg-edit-textarea" rows="3"></textarea>' +
      '<div class="msg-edit-actions">' +
      '<button type="button" class="msg-edit-cancel">Cancel</button>' +
      '<button type="button" class="msg-edit-save">Save</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('.msg-edit-textarea');
    textarea.value = currentText;
    textarea.focus();
    textarea.selectionStart = textarea.value.length;

    const escListener = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    // Modal kisi bhi tareeqe se band ho, keydown listener hamesha hat jaye
    const closeModal = () => {
      document.removeEventListener('keydown', escListener);
      overlay.remove();
    };
    document.addEventListener('keydown', escListener);

    overlay.querySelector('.msg-edit-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    overlay.querySelector('.msg-edit-save').addEventListener('click', () => {
      const newText = textarea.value.trim();
      if (!newText || newText === currentText) {
        closeModal();
        return;
      }
      editMessageRequest(msgId, newText, bubble);
      closeModal();
    });
  }

  /* ------------------------------------------------------------------ */
  /* INFO MODAL                                                          */
  /* ------------------------------------------------------------------ */
  function openInfoModal(bubble, msgId) {
    const overlay = document.createElement('div');
    overlay.className = 'msg-edit-overlay';
    overlay.innerHTML =
      '<div class="msg-info-modal">' +
      '<h3>Message info</h3>' +
      '<div class="msg-info-body">' +
      '<div class="msg-info-loading">' +
      '<div class="chat-loading-dots"><span></span><span></span><span></span></div>' +
      '</div>' +
      '</div>' +
      '<div class="msg-edit-actions">' +
      '<button type="button" class="msg-edit-cancel">Close</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const escListener = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    const closeModal = () => {
      document.removeEventListener('keydown', escListener);
      overlay.remove();
    };
    document.addEventListener('keydown', escListener);

    overlay.querySelector('.msg-edit-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    messageInfoRequest(msgId, overlay);
  }

  function messageInfoRequest(msgId, overlay) {
    fetch(ROUTES.messageInfo, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
      body: JSON.stringify({ id: msgId }),
    })
      .then((res) => res.json())
      .then((result) => renderMessageInfo(result, overlay))
      .catch(() => renderMessageInfoError(overlay));
  }

  function renderMessageInfo(result, overlay) {
    if (!overlay.isConnected) return;
    const body = overlay.querySelector('.msg-info-body');

    if (!result.success) {
      renderMessageInfoError(overlay, result.message);
      return;
    }

    const recipients = result.info || [];

    if (recipients.length === 0) {
      body.innerHTML = `<p class="msg-info-error">No info available.</p>`;
      return;
    }

    body.innerHTML = recipients.map((r) => {
      let icon, label, time;

      if (r.seen_at) {
        icon = 'bi-check2-all seen';
        label = 'Seen';
        time = r.seen_at;
      } else if (r.delivered_at) {
        icon = 'bi-check2-all';
        label = 'Delivered';
        time = r.delivered_at;
      } else if (r.created_at) {
        icon = 'bi-check2';
        label = 'Sent';
        time = r.created_at;
      } else {
        icon = 'bi-clock';
        label = 'Pending';
        time = null;
      }

      return `
      <div class="msg-info-recipient">
        <div class="msg-info-recipient-main">
          <span class="msg-info-recipient-name">${escapeHtml(r.recipient_name)}</span>
          <span class="msg-info-recipient-status">${label}</span>
        </div>
        <div class="msg-info-recipient-time">
          <i class="bi ${icon}"></i>
          <span>${time ? formatTime(time) : '—'}</span>
        </div>
      </div>
    `;
    }).join('');
  }

  function renderMessageInfoError(overlay, message) {
    if (!overlay.isConnected) return;
    const body = overlay.querySelector('.msg-info-body');
    body.innerHTML = `<p class="msg-info-error">${message ? escapeHtml(message) : 'Could not load message info.'}</p>`;
  }

  /* ------------------------------------------------------------------ */
  /* DELETE CONFIRM (SweetAlert2)                                        */
  /* ------------------------------------------------------------------ */
  function confirmDeleteMessage(bubble, msgId, mode) {
    if (typeof Swal === 'undefined') {
      console.warn('SweetAlert2 (Swal) is not loaded — include its CDN script to enable delete confirmation.');
      return;
    }

    const isEveryone = mode === 'everyone';

    Swal.fire({
      title: isEveryone ? 'Delete for everyone?' : 'Delete for me?',
      text: isEveryone
        ? 'This message will be removed for everyone in this chat. This cannot be undone.'
        : 'This message will be removed only from your side of the chat.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e35d5d',
      cancelButtonColor: '#6b8280',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMessageRequest(msgId, mode, bubble);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* AJAX — uses the global ROUTES object                                */
  /* ------------------------------------------------------------------ */
  function editMessageRequest(msgId, newText, bubble) {
    fetch(ROUTES.editMessage, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'X-Socket-ID': Echo.socketId()

      },
      body: JSON.stringify({ id: msgId, message: newText }),
    })
      .then((res) => res.json())
      .then((result) => {
        handleEditMessageResponse(result, bubble, newText);
        if (result.success && typeof Toastify !== 'undefined') {
          Toastify({
            text: result.message || 'Message updated.',
            style: { background: '#13B0A7' },
            close: true,
            offset: { x: 0, y: 50 },
            position: 'center',
            gravity: 'bottom',
            duration: 1500,
          }).showToast();
        }
      })
      .catch(() => notify('Failed to edit message.'));
  }

  function deleteMessageRequest(msgId, mode, bubble) {
    fetch(ROUTES.deleteMessage, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'X-Socket-ID': Echo.socketId()
      },
      body: JSON.stringify({ id: msgId, mode: mode }),
    })
      .then((res) => res.json())
      .then((result) => handleDeleteMessageResponse(result, bubble))
      .catch(() => notify('Failed to delete message.'));
  }

  function lastMsgRequest() {
    if (activeChatId === null) return;
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${activeChatId}"]`);
    if (!chatItem) return;
    const chatItemPreview = chatItem.querySelector('.chat-item-preview');
    fetch(ROUTES.lastMessage, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({
        'chat_id': activeChatId
      })
    }).then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          chatItemPreview.innerHTML = ``;
          return;
        }
        chatItemPreview.innerHTML = `<i class="bi ${result.lastMsg ? result.lastMsg.sender_id === window.AUTH_ID ? (result.lastMsg.status === 'seen'
          ? 'bi-check2-all text-primary'
          : (result.lastMsg.status === 'delivered'
            ? 'bi-check2-all'
            : 'bi-check2'))
          : 'hidden' : 'hidden'}"></i>
           ${result.lastMsg ? (result.lastMsg.type === 'text' ? escapeHtml(result.lastMsg.message) : 'File') : ''}`;
      })
  }

  /* ------------------------------------------------------------------ */
  /* UI updates once the AJAX response comes back                        */
  /* ------------------------------------------------------------------ */
  function handleEditMessageResponse(result, bubble, newText) {
    if (!result.success) {
      notify(result.message || 'Could not edit message.');
      return;
    }

    const textEl = bubble.querySelector('.msg-text');
    if (textEl) textEl.textContent = newText;
    document.dispatchEvent(new CustomEvent('chat:refresh-last-msg'));
  }

  function handleDeleteMessageResponse(result, bubble) {
    if (!result.success) {
      notify(result.message || 'Could not delete message.');
      return;
    }
    document.dispatchEvent(new CustomEvent('chat:refresh-last-msg'));
    Toastify({
      text: result.message || 'Message updated.',
      style: { background: '#13B0A7' },
      close: true,
      offset: { x: 0, y: 50 },
      position: 'center',
      gravity: 'bottom',
      duration: 1500,
    }).showToast()
    bubble.remove();
  }
})();

function notify(text) {
  if (typeof Toastify !== 'undefined') {
    Toastify({
      text,
      duration: 3000,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
    }).showToast();
  } else {
    console.warn(text);
  }
}