<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#14b8ae">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>Chats — Chatify</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">

  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('css/chats.css') }}">
  {{-- NEW: chats.css ke baad hi load hona chahiye --}}
  <link rel="stylesheet" href="{{ asset('css/chats-responsive.css') }}">
</head>

<body class="chats-body">
  <div class="chat-app" id="chatApp">

    @include('Main.partials.navigation')
    {{-- NEW: mobile (<=767px) par hamburger + full-screen navigation --}}
    @include('Main.partials.mobile-navigation')

    <!-- ============ CHAT LIST ============ -->
    <aside class="chat-list-panel">
      <header class="chat-list-header">
        <h1>Chats</h1>
        <div class="chat-list-header-actions">
          <button type="button" class="icon-btn" title="Menu coming soon!"><i class="bi bi-three-dots-vertical"></i></button>
        </div>
      </header>

      <div class="chat-search">
        <i class="bi bi-search"></i>
        <input type="text" id="chatSearchInput" placeholder="Search or start a new chat">
      </div>

      <ul class="chat-list" id="chatList">
        @foreach ($authUser->chats as $chat)
              @php
                $onlineCollection = $chat->onlineUsers();
                $onlineCount = $onlineCollection->filter()->count();

                $otherUser = $chat->type === 'direct'
                  ? $chat->users->where('id', '!=', auth()->id())->first()
                  : null;
                $avatar = $chat->type === 'direct' ? ($otherUser->avatar ?? 'avatars/defaultChat.png') : ($chat->avatar ?? 'avatars/defaultGroup.png');

                $contactStatus = $otherUser
                  ? $authUser->contacts->where('contact_id', $otherUser->id)->first()?->status
                  : null;

                if($chat->status === 'active'){
                  $status = $chat->type === 'direct'
                  ? ($onlineCount > 0 ? 'Online' : 'Offline')
                  : ($onlineCount > 0 ? $onlineCount . ' online' : '');
                } else {
                  $status = '';
                }
              @endphp
              <li class="chat-item {{ isset($chat_hash) && $chat->chat_hash === $chat_hash ? 'active' : '' }}"
                data-chat-id="{{ $chat->id }}" data-chat-hash="{{ $chat->chat_hash }}"
                data-name="{{ $chat->type === 'direct' ? $otherUser->name : $chat->title }}" data-status="{{ $status }}"
                data-created-by="{{ $chat->created_by }}" data-chat-status="{{ $chat->status }}" data-chat-type="{{ $chat->type }}"
                data-avatar="{{ asset('storage/' . $avatar) }}" data-contact-status="{{ $contactStatus ?? 'null' }}">
                <span class="avatar"><img src="{{ asset('storage/' . $avatar) }}" alt=""></span>
                <div class="chat-item-body">
                  <div class="chat-item-row">
                    <span class="chat-item-name">{{ $chat->type === 'direct' ? $otherUser->name : $chat->title }}</span>
                    <span class="chat-item-time">{{ $chat->lastMsg ? $chat->lastMsg->created_at->format('H:i') : '' }}</span>
                  </div>
                  <div class="chat-item-row">
                    <span class="chat-item-preview">
                      <i class="bi {{ $chat->lastMsg ? $chat->lastMsg->sender_id === auth()->id()
          ? ($chat->lastMsg->status === 'seen'
            ? 'bi-check2-all text-primary'
            : ($chat->lastMsg->status === 'delivered'
              ? 'bi-check2-all'
              : 'bi-check2'))
          : 'hidden' : 'hidden' }}">
                      </i>
                      {{ $chat->lastMsg ? ($chat->lastMsg->type === 'text' ? $chat->lastMsg->message : 'File') : '' }}
                    </span>
                    <span class="chat-item-unread {{ $chat->unreadCount->count() > 0 ? '' : 'hidden' }}">
                      {{ $chat->unreadCount->count() > 0 ? $chat->unreadCount->count() : '' }}
                    </span>
                  </div>
                </div>
              </li>
        @endforeach
      </ul>
    </aside>

    <!-- ============ MAIN CHAT PANEL ============ -->
    <main class="chat-main">

      <!-- Empty state, shown before any chat is selected -->
      <div class="chat-empty-state" id="chatEmptyState" hidden>
        <div class="chat-empty-icon"><i class="bi bi-chat-heart"></i></div>
        <h2>Chatify Web</h2>
        <p>Left panel se koi chat select karein taake yahan messages nazar aayein.</p>
      </div>

      <!-- Active conversation -->
      <div class="chat-conversation" id="chatConversation">

        <header class="chat-main-topbar">
          <div class="chat-main-contact">
            {{-- NEW: sirf mobile par nazar aata hai --}}
            <button type="button" class="icon-btn chat-back-btn" id="chatBackBtn" title="Back" aria-label="Back to chats">
              <i class="bi bi-arrow-left"></i>
            </button>
            <span class="avatar" id="activeChatAvatar"></span>
            <div>
              <span class="chat-main-contact-name" id="activeChatName"></span>
              <span class="chat-main-contact-status" id="activeChatStatus"></span>
            </div>
          </div>
          <div class="chat-main-actions">
            <button type="button" class="icon-btn hide-xs" title="Search in chat"><i class="bi bi-search"></i></button>
            <button type="button" class="icon-btn" title="Voice call"><i class="bi bi-telephone-fill"></i></button>
            <button type="button" class="icon-btn" title="Video call"><i class="bi bi-camera-video-fill"></i></button>
            <button type="button" class="icon-btn" title="Menu"><i class="bi bi-three-dots-vertical"></i></button>
          </div>
        </header>

        <div class="chat-messages" id="chatMessages">
          <!-- Load older messages trigger — JS ise preserve karta hai, delete nahi karta -->
          <div class="load-older-messages" id="loadOlderMessages" hidden>
            <button type="button" class="load-older-btn" id="loadOlderBtn">
              <i class="bi bi-arrow-up-circle"></i>
              <span>Load older messages</span>
            </button>
            <div class="load-older-loading" id="loadOlderLoading" hidden>
              <div class="chat-loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
          <!-- messages injected here by chats.js, grouped by date -->
        </div>

        <div class="chat-loading" id="chatLoading" hidden>
          <div class="chat-loading-dots"><span></span><span></span><span></span></div>
        </div>

        <div id="input-area"></div>

      </div>
    </main>

  </div>

  <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>

  @vite(['resources/js/chats.js'])
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


</body>

</html>