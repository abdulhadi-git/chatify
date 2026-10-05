import './bootstrap.js';
import { handleMessagesResponse, moveChatItemToTop } from './sharedFunctions.js';

/* ==========================================================================
   MESSAGE SOUND
   ========================================================================== */
const messageSound = new Audio('/sounds/message.mp3');
messageSound.volume = 0.6;

let lastSoundPlayedAt = 0;

function isSoundEnabled() {
    // Abhi localStorage, baad mein Notifications settings page se connect kar lena
    return localStorage.getItem('messageSound') !== 'off';
}

function playMessageSound() {
    if (!isSoundEnabled()) return;

    // Throttle: 1 second mein sirf ek baar
    const now = Date.now();
    if (now - lastSoundPlayedAt < 1000) return;
    lastSoundPlayedAt = now;

    messageSound.currentTime = 0;
    messageSound.play().catch(() => {
        // Browser ne autoplay block kiya, ignore
    });
}

// Pehle user interaction par audio "unlock" karo (autoplay policy)
function unlockAudio() {
    messageSound.muted = true;
    messageSound.play().then(() => {
        messageSound.pause();
        messageSound.currentTime = 0;
        messageSound.muted = false;
    }).catch(() => {
        messageSound.muted = false;
    });
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
}
window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

document.addEventListener('DOMContentLoaded', function () {
    // Blade me: <script>window.AUTH_ID = {{ auth()->id() }};</script>
    const chatMessagesEl = document.querySelector('.chat-messages');
    const authUserId = window.AUTH_ID;

    if (!authUserId) return;

    // CSRF token — ek hi jagah define karo, aage har fetch isko use karega
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    window.csrfToken = csrfToken;

    window.Echo.private(`User.${authUserId}`)
        .listen('.markAsSeen', (e) => {
            if (parseInt(e.chatId) === parseInt(window.activeChatId)) {
                changeAllBubblesStatus('seen');
            }
            changeChatListStatus(e.chatId, 'seen');
        })
        .listen('.markAsDelivered', (e) => {
            if (parseInt(e.chatId) === parseInt(window.activeChatId)) {
                changeAllBubblesStatus('delivered');
            }
            changeChatListStatus(e.chatId, 'delivered');
        })
        .listen('.incomingMessages', (e) => {
            moveChatItemToTop(e.chat_id);
            const isActiveChat = parseInt(e.chat_id) === parseInt(window.activeChatId);

            updateStatus(e.id, isActiveChat ? 'seen' : 'delivered');
            updateChatListPreview(e);

            if (isActiveChat) {
                handleMessagesResponse([e]);
            } else {
                incrementUnreadBadge(e.chat_id);
                showNavChatDot();
            }

            // Sound: dusri chat ho, tab background mein ho, ya user ne
            // Settings > More settings me "Sound in the open chat" on kiya ho
            const soundInOpenChat = localStorage.getItem('soundInActiveChat') === 'on';
            if (!isActiveChat || document.hidden || soundInOpenChat) {
                playMessageSound();
            }
        })
        .listen('.messageStatusUpdated', (e) => {
            if (parseInt(window.activeChatId) === parseInt(e.chat_id)) {
                changeBubbleStatus(e.message_id, e.status);
            }
            changeChatListStatus(e.chat_id, e.status);
        })
        // Listen to user status
        .listen('.statusChanged', (e) => {
            if (Number(e.userId) === Number(window.AUTH_ID)) return;

            const statusEl = document.querySelector('.chat-main-contact-status');

            e.chatIds.forEach((chatId) => {
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
                if (!chatItem) return;

                const isActive = Number(window.activeChatId) === Number(chatId);

                if (chatItem.dataset.chatType === 'direct') {
                    const status = e.isOnline ? 'Online' : 'Offline';
                    chatItem.dataset.status = status;
                    if (isActive) setStatusText(statusEl, status);
                } else {
                    let count = parseInt(chatItem.dataset.status) || 0;
                    count = e.isOnline ? count + 1 : Math.max(0, count - 1);

                    const newStatus = count > 0 ? `${count} Online` : '';
                    chatItem.dataset.status = newStatus;
                    if (isActive) setStatusText(statusEl, newStatus);
                }
            });
        })
        // listen to msg updates or deletes
        .listen('.updateMsg', (e) => {
            if (Number(window.activeChatId) === Number(e.chatId)) {
                const msgBubble = chatMessagesEl.querySelector(`.msg-bubble[data-msg-id="${e.msgId}"]`);
                const msgText = msgBubble && msgBubble.querySelector('.msg-text');
                if (msgText) msgText.textContent = e.newMsg;
            }
            updateChatListItem(e.chatId);
        })
        .listen('.deleteMsg', (e) => {
            if (Number(window.activeChatId) === Number(e.chatId)) {
                const msgBubble = chatMessagesEl.querySelector(`.msg-bubble[data-msg-id="${e.msgId}"]`);
                if (msgBubble) {
                    msgBubble.textContent = 'This message was deleted';
                    msgBubble.classList.add('text-muted', 'fst-italic');
                }
            }
            updateChatListItem(e.chatId);
        });

    markOnline();
    setInterval(markOnline, 60000);

    function markOnline() {
        fetch('/online-status/mark-online', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json',
                'X-Socket-ID': window.Echo.socketId(),
            },
        });
    }

    // Jab MAIN user khud tab/browser band kare, uska apna status offline karo.
    window.addEventListener('pagehide', () => {
        const token = document.querySelector('meta[name="csrf-token"]').content;
        navigator.sendBeacon(
            `/online-status/mark-offline?_token=${encodeURIComponent(token)}`,
            new Blob([JSON.stringify({})], { type: 'application/json' })
        );
    });

});

function updateChatListItem(chatId) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (!chatItem) return;
    const chatItemPreview = chatItem.querySelector('.chat-item-preview');
    fetch('/chats/messages/last-msg', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            'chat_id': chatId
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
           ${result.lastMsg ? (result.lastMsg.type === 'text' ? result.lastMsg.message : 'File') : ''}`;
        })
}

// Back button se cached page aaye to reload karo, taake server login check kare
window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
});

function updateStatus(msgId, status) {
    fetch(`/chats/messages/update-status/${msgId}`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': window.csrfToken,
            'X-SOCKET-ID': window.Echo.socketId()
        },
        body: JSON.stringify({
            status: status,
        })
    }).then((res) => res.json())
        .then((data) => {
            if (!data.success) {
                return;
            }
        });
}

/* ==========================================================================
   CHAT LIST — naye incoming message par preview text update + item ko
   list ke top par le jana (WhatsApp jaisa behavior)
   ========================================================================== */
function updateChatListPreview(e) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${e.chat_id}"]`);
    if (!chatItem) return;

    const preview = chatItem.querySelector('.chat-item-preview');
    if (preview) {
        preview.innerHTML = '';
        const icon = document.createElement('i');
        icon.className = 'bi hidden';
        preview.appendChild(icon);
        preview.appendChild(document.createTextNode(' ' + (e.type === 'text' ? e.message : 'File')));
    }

    const timeEl = chatItem.querySelector('.chat-item-time');
    if (timeEl) {
        timeEl.textContent = formatChatListTime(e.created_at);
    }

    const list = document.querySelector('.chat-list');
    if (list && chatItem.parentElement === list) {
        list.prepend(chatItem);
    }
}

function formatChatListTime(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function setStatusText(el, text) {
    if (!el) return;

    clearTimeout(el._statusTimer);

    if (el.textContent === text) {
        el.classList.remove('status-hide');
        el.classList.toggle('status-empty', !text);
        return;
    }

    el.classList.add('status-hide');

    el._statusTimer = setTimeout(() => {
        el.textContent = text;
        el.classList.toggle('status-empty', !text);
        el.classList.remove('status-hide');
    }, 200);
}

function incrementUnreadBadge(chatId) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (!chatItem) return;

    let badge = chatItem.querySelector('.chat-item-unread');
    if (!badge) return; // guard: badge element na mile to crash na ho

    const current = parseInt(badge.textContent) || 0;
    badge.textContent = current + 1;
    badge.hidden = false;
    badge.classList.remove('hidden');
}

function changeBubbleStatus(msgId, status) {
    const msg = document.querySelector(`.msg-bubble[data-msg-id='${msgId}']`);
    if (!msg) return;
    const tick = msg.querySelector('.msg-meta i');
    if (!tick) return;
    if (status === 'delivered') {
        tick.classList.remove('bi-check2');
        tick.classList.add('bi-check2-all');
    } else {
        tick.classList.remove('bi-check2');
        tick.classList.add('bi-check2-all', 'seen', 'text-primary');
    }
}

function changeAllBubblesStatus(status) {
    const container = document.querySelector('#chatMessages');
    if (!container) return;

    const bubbles = container.querySelectorAll('.msg-bubble.outgoing');

    bubbles.forEach(msg => {
        const tick = msg.querySelector('.msg-meta i');
        if (!tick) return;

        tick.classList.remove('bi-check2');
        if (status === 'delivered') {
            tick.classList.add('bi-check2-all');
        } else {
            tick.classList.add('bi-check2-all', 'seen', 'text-primary');
        }
    });
}

function changeChatListStatus(chatId, status) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (!chatItem) return;
    const tick = chatItem.querySelector('.chat-item-preview i');
    if (!tick) return;
    if (status === 'delivered') {
        tick.classList.remove('bi-check2');
        tick.classList.add('bi-check2-all');
    } else {
        tick.classList.remove('bi-check2');
        tick.classList.add('bi-check2-all', 'seen', 'text-primary');
    }
}

function hideNavChatDot() {
    const dot = document.getElementById('navChatDot');
    if (!dot) return;
    dot.hidden = true;
    dot.classList.add('hidden');
}
window.hideNavChatDot = hideNavChatDot;

function showNavChatDot() {
    const dot = document.getElementById('navChatDot');
    if (!dot) return;
    dot.hidden = false;
    dot.classList.remove('hidden');
}
window.showNavChatDot = showNavChatDot;