export function handleMessagesResponse(msg) {

    renderMessageGroups(msg);
    scrollMessagesToBottom();
}
const chatMessagesEl = document.getElementById('chatMessages');


function buildMessageBubble(msg) {
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
function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function statusIconClass(status) {
  if (status === 'seen') return 'bi bi-check2-all seen';
  if (status === 'delivered') return 'bi bi-check2-all';
  if (status === 'sent') return 'bi bi-check2';
  return 'bi bi-clock';
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
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

// Agar DOM me sabse aakhri divider isi date label ka pehle se maujood hai,
// to dobara naya divider nahi banate — sirf tab banate hain jab date badal
// gayi ho (ya abhi tak koi divider hai hi nahi).
function ensureDividerFor(dateLabel) {
  const dividers = chatMessagesEl.querySelectorAll('.date-divider');
  const lastDivider = dividers.length ? dividers[dividers.length - 1] : null;

  if (lastDivider && lastDivider.textContent === dateLabel) {
    return; // already maujood hai, dobara mat banao
  }

  const divider = document.createElement('div');
  divider.className = 'date-divider';
  divider.textContent = dateLabel;
  chatMessagesEl.appendChild(divider);
}

function renderMessageGroups(messages) {

  const groups = groupMessagesByDate(messages);
  Object.keys(groups).forEach((dateLabel) => {
    ensureDividerFor(dateLabel); // <-- pehle jaisa unconditional divider hata kar yeh use kiya
    groups[dateLabel].forEach((msg) => {
      chatMessagesEl.appendChild(buildMessageBubble(msg));
    });
  });
}
  function scrollMessagesToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
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

// Chat item ko list mein top par smoothly le aata hai (FLIP animation)
export function moveChatItemToTop(chatId) {
  const listEl = document.querySelector('.chat-list');
  const item = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
  if (!listEl || !item) return;

  // agar loader/pagination element hai to usay ignore kar ke sirf pehla
  // .chat-item dhoondo
  const firstItem = listEl.querySelector('.chat-item');
  if (firstItem === item) return; // already top par hai

  // FLIP: "First" position record karo
  const first = item.getBoundingClientRect();

  listEl.insertBefore(item, firstItem);

  // "Last" position record karo aur difference nikalo
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