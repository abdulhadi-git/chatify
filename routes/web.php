<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatsController;
use App\Http\Controllers\GroupsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ContactsController;
use App\Http\Controllers\DiscoverController;
use App\Http\Controllers\OnlineStatusController;
use App\Http\Controllers\ProfileController;
use GuzzleHttp\Middleware;
use SebastianBergmann\CodeCoverage\Report\Html\Dashboard;

Route::get('/', function () {
    return view('home');
});
Route::middleware('guest')->group(function () {
    Route::get('/signin', [AuthController::class, 'showLoginForm'])->name('show-sign-in');
    Route::get('/signup', [AuthController::class, 'showRegisterForm'])->name('show-sign-up');
    Route::get('/forgot-password', [AuthController::class, 'showForgotPasswordForm'])->name('showForgotPasswordForm');
    Route::post('/sign-up', [AuthController::class, 'signUp'])->name('sign-up');
    Route::get('/otp/{token}', [AuthController::class, 'showOtpForm'])->name('otp');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPasswordForm'])->name('password.reset');
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->name('verify-otp');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
        Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->name('resend-otp');
        Route::post('/sendResetLink', [AuthController::class, 'sendResetLink']);
        Route::post('/changePassword', [AuthController::class, 'changePassword']);
    }); 
});
Route::middleware('auth')->group(function(){
    // chat routes
    Route::get('/chats', [ChatsController::class, 'showChats'])->name('show.chats');
    Route::get('/chats/load-more', [ChatsController::class, 'loadMoreChats'])->name('chats.loadMore');
    Route::get('/chats/{chat_hash}', [ChatsController::class, 'showParticularChat'])->name('specific.chat');
    Route::post('/chats/start', [ChatsController::class, 'startChat'])->name('start.chats');
    Route::get('/chats/messages/{chat_hash}', [ChatsController::class, 'getMessages'])->name('get.messages');
    Route::get('/chats/messages/{chatHash}/load-more', [ChatsController::class, 'loadMoreMessages'])->name('chats.messages.loadMore');
    Route::post('/chats/messages/send', [ChatsController::class, 'sendMessages'])->name('send.messages');
    Route::post('/chats/messages/edit', [ChatsController::class, 'editMessage'])->name('edit.message');
    Route::post('/chats/messages/delete', [ChatsController::class, 'deleteMsg'])->name('delete.msg');
    Route::post('/chats/messages/last-msg', [ChatsController::class, 'lastMsg'])->name('last.msg');
    Route::post('/chats/send/attachments', [ChatsController::class, 'sendAttachments'])->name('send.Attachments');
    Route::post('/chats/download/attachments', [ChatsController::class, 'downloadAttachments'])->name('download.Attachments');
    Route::post('/chats/messages/update-status/{msgId}', [ChatsController::class, 'updateStatus'])->name('update.status');
    Route::post('/chats/messages/info', [ChatsController::class, 'messageInfo'])->name('msg.info');
    

    // contacts routes
    Route::get('/contacts', [ContactsController::class, 'showContacts'])->name('show.contacts');
    Route::post('/contacts/block', [ContactsController::class, 'blockContact'])->name('block.contact');
    Route::post('/contacts/unBlock', [ContactsController::class, 'unBlockContact'])->name('unBlock.contact');
    Route::post('/contacts/delete', [ContactsController::class, 'deleteContact'])->name('delete.contact');
    Route::get('/contacts/friend-requests', [ContactsController::class, 'friendRequests'])->name('contacts.friendRequests');
    Route::post('/contacts/friend-requests/respond', [ContactsController::class, 'respondFriendRequest'])->name('contacts.respondFriendRequest');
    
    // groups routes
    Route::get('/groups', [GroupsController::class, 'showGroups'])->name('show.groups');
    Route::post('/groups/create', [GroupsController::class, 'createGroups'])->name('create.groups');
    Route::get('/groups/contacts', [GroupsController::class, 'groupContacts'])->name('group.contacts');
    Route::get('/groups/{group_hash}', [GroupsController::class, 'showGroups'])->name('specific.group');
    Route::get('/groups/details/{group_hash}', [GroupsController::class, 'groupDetails'])->name('group.details');
    Route::post('/groups/avatar/upload', [GroupsController::class, 'updateGroupAvatar'])->name('group.avatar.upload');
    Route::post('/groups/avatar/remove', [GroupsController::class, 'removeAvatar'])->name('remove.avatar');
    Route::post('/groups/member/remove', [GroupsController::class, 'removeMember'])->name('remove.member');
    Route::post('/groups/addMembers', [GroupsController::class, 'addMembers'])->name('add.members');
    Route::post('/groups/delete', [GroupsController::class, 'deleteGroup'])->name('delete.group');

    // discover routes
    Route::get('/discover', [DiscoverController::class, 'discover'])->name('discover');
    Route::get('/discover/search', [DiscoverController::class, 'search'])->name('search');
    Route::get('/discover/profile/{userId}', [DiscoverController::class, 'openProfile'])->name('open.profile');
    Route::post('/discover/friend/add', [DiscoverController::class, 'addFriend'])->name('add.friend');

    // profile routes
    Route::get('/profile', [ProfileController::class, 'showProfile'])->name('show.profile');
    Route::post('/updateProfile', [ProfileController::class, 'updateProfile'])->name('update.profile');

    // settings routes
    Route::get('/settings', [SettingsController::class, 'showSettings'])->name('show.settings');
    Route::get('/settings/blocked', [SettingsController::class, 'showBlockedUsers'])->name('show.blocked.users');
    Route::post('/settings/blocked/unblock', [SettingsController::class, 'unblockContact'])->name('unblock.contact');
    Route::post('/settings/password', [SettingsController::class, 'updatePassword'])->name('update.password');
    Route::post('/logout', [SettingsController::class, 'logout'])->name('logout');
    



    // online / offline presence routes
    Route::post('/online-status/mark-online', [OnlineStatusController::class, 'markOnline']);
    Route::post('/online-status/mark-offline', [OnlineStatusController::class, 'markOffline']);
    Route::get('/online-status/check/{userId}', [OnlineStatusController::class, 'checkStatus']);

    
});
