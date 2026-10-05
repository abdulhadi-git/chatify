@php
                $onlineCollection = $chat->onlineUsers(); // brackets HATA do, relation access hai
                $onlineCount = $onlineCollection->filter()->count(); // filter() ki zarurat nahi agar relation already sahi users deti hai
                $authUser= auth()->user();
                $otherUser = $chat->type === 'direct'
                  ? $chat->users->where('id', '!=', auth()->id())->first()
                  : null;
                $avatar = $chat->type === 'direct' ? ($otherUser->avatar ?? 'avatars/defaultChat.png') : ($chat->avatar ?? 'avatars/defaultGroup.png');

                $contactStatus = $otherUser
                  ? $authUser->contacts->where('contact_id', $otherUser->id)->first()?->status
                  : null;

                $status = $chat->type === 'direct'
                  ? ($onlineCount > 0 ? 'Online' : 'Offline')
                  : ($onlineCount > 0 ? $onlineCount . ' online' : '');
              @endphp
              <li class="chat-item {{ isset($chat_hash) && $chat->chat_hash === $chat_hash ? 'active' : '' }}"
                data-chat-id="{{ $chat->id }}" data-chat-hash="{{ $chat->chat_hash }}"
                data-name="{{ $chat->type === 'direct' ? $otherUser->name : $chat->title }}" data-status="{{ $status }}"
                data-created-by="{{ $chat->created_by }}" data-chat-status="{{ $chat->status }}"
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
          : 'hidden': 'hidden' }}">
                      </i>
                      {{ $chat->lastMsg ? ($chat->lastMsg->type === 'text' ? $chat->lastMsg->message : 'File') : '' }}
                    </span>
                    <span class="chat-item-unread {{ $chat->unreadCount->count() > 0 ? '' : 'hidden' }}">
                      {{ $chat->unreadCount->count() > 0 ? $chat->unreadCount->count() : '' }}
                    </span>
                  </div>
                </div>
              </li>