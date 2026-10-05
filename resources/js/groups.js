/* ==========================================================================
   CHATIFY — groups.js (responsive/mobile-ready + create group + add members)
   Groups page behavior: left list -> click -> AJAX call -> right profile.

   Mobile changes:
   - openGroup() / closeGroupProfile() `.groups-app.show-profile` aur
     `body.conversation-open` (hamburger hide) toggle karte hain.
   - Back arrow (#groupBackBtn) + browser/Android back button kaam karte hain.
   - Stale (out-of-order) group-details responses ignore hote hain.

   Create group:
   - + button -> modal (title/avatar) -> Select members -> contacts (15/page)
     -> multi check -> Create -> POST -> list me naya group.

   Add members (owner only):
   - Profile ke neeche "Add Members" button -> same modal, seedha contacts step
     (existing members list me nahi aate) -> select -> POST /groups/addMembers.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initGroupList();
    initBackButton();
    initCreateGroup();
    requestForParticularGroup();
});

// Routes — apne Laravel routes ke hisaab se yahan adjust kar lein.
const GROUP_ROUTES = {
    groupDetails: (groupHash) => `/groups/details/${groupHash}`,
    uploadAvatar: `/groups/avatar/upload`,
    removeAvatar: `/groups/avatar/remove`,
    deleteGroup: `/groups/delete`,
    removeMember: `/groups/member/remove`,
};

const mobileMQ = window.matchMedia('(max-width: 767.98px)');

let activeGroupId = null;
let activeGroupHash = null;
let activeFetchToken = 0; // out-of-order group-details responses ignore karne ke liye

const groupsAppEl = document.getElementById('groupsApp');
const groupListEl = document.getElementById('groupList');
const groupSearchInput = document.getElementById('groupSearchInput');
const groupEmptyStateEl = document.getElementById('groupEmptyState');
const groupLoadingEl = document.getElementById('groupLoading');
const groupProfileEl = document.getElementById('groupProfile');

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function assetPath(path) {
    if (!path) return '';
    return `${window.storageUrl}/${path}`;
}

/* ==========================================================================
   Deep link support (e.g. /groups/{hash} on first load / back-forward nav)
   ========================================================================== */
function requestForParticularGroup() {
    const url = window.location.pathname.split('/').filter(Boolean);
    if (url.length > 1) {
        const hash = url.pop();
        const item = groupListEl.querySelector(`.group-item[data-group-hash="${hash}"]`);
        if (item) {
            setActiveListItem(item);
            openGroup(item, false); // history me nayi entry nahi, sirf current ko state de do
            history.replaceState({ groupHash: hash }, '', location.href);
        }
    }
}

// Browser back/forward + Android hardware back button
window.addEventListener('popstate', (event) => {
    const hash = event.state && event.state.groupHash;
    if (hash) {
        const item = groupListEl.querySelector(`.group-item[data-group-hash="${hash}"]`);
        if (item) setActiveListItem(item);
        activeGroupHash = hash;
        showGroupScreen();
        fetchGroupDetails(hash); // history dobara push nahi karni
        return;
    }
    closeGroupProfile();
});

/* ==========================================================================
   GROUP LIST
   ========================================================================== */
// Per-item bind: naye bane group par bhi same click behavior lag sake
function bindGroupItem(item) {
    item.addEventListener('click', () => {
        if (item.classList.contains('active')) return;
        setActiveListItem(item);
        openGroup(item, true);
    });
}

function initGroupList() {
    groupListEl.querySelectorAll('.group-item').forEach(bindGroupItem);

    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', () => {
            const term = groupSearchInput.value.trim().toLowerCase();
            // live query: naye add hue groups bhi filter honge
            groupListEl.querySelectorAll('.group-item').forEach((item) => {
                const name = item.dataset.name.toLowerCase();
                item.style.display = name.includes(term) ? '' : 'none';
            });
        });
    }
}

function setActiveListItem(item) {
    groupListEl.querySelectorAll('.group-item').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
}

// mobile: profile screen slide-in + hamburger hide (mobile-navigation css `conversation-open` ko dekhta hai)
function showGroupScreen() {
    groupsAppEl.classList.add('show-profile');
    document.body.classList.add('conversation-open');
}

function openGroup(item, updateHistory = true) {
    activeGroupId = item.dataset.groupId;
    activeGroupHash = item.dataset.groupHash;

    showGroupScreen();

    if (updateHistory) {
        const newUrl = `/groups/${activeGroupHash}`;
        history.pushState({ groupHash: activeGroupHash, fromList: true }, '', newUrl);
    }

    fetchGroupDetails(activeGroupHash);
}

function closeGroupProfile() {
    activeFetchToken++; // in-flight response ignore ho
    activeGroupId = null;
    activeGroupHash = null;

    // dobara usi group par tap kar sakein (click handler active par kuch nahi karta)
    groupListEl.querySelectorAll('.group-item.active').forEach((i) => i.classList.remove('active'));

    groupsAppEl.classList.remove('show-profile');
    document.body.classList.remove('conversation-open');

    const resetPanel = () => {
        if (activeGroupHash !== null) return; // is dauran koi aur group khul gaya
        groupProfileEl.hidden = true;
        groupProfileEl.innerHTML = '';
        groupLoadingEl.hidden = true;
        groupEmptyStateEl.hidden = false;
    };
    // Mobile par slide-out animation poori hone do
    if (mobileMQ.matches) setTimeout(resetPanel, 380);
    else resetPanel();
}

function initBackButton() {
    const backBtn = document.getElementById('groupBackBtn');
    if (!backBtn) return;
    backBtn.addEventListener('click', () => {
        if (history.state && history.state.fromList) {
            history.back(); // popstate -> closeGroupProfile()
        } else {
            // deep link se aaye hain: page chhodne ke bajaye list par aa jao
            history.replaceState({}, '', '/groups');
            closeGroupProfile();
        }
    });
}

/* ==========================================================================
   FETCH GROUP DETAILS
   Expected JSON shape:
   {
     success: true,
     group: {
       id: 12,
       title: "Frontend Team",
       avatar: "groups/xyz.jpg" | null,      // relative path (assetPath lagta hai)
       created_by: 4,
       users: [
         { id: 4, name: "Ahmed Raza", avatar: null },
         { id: 9, name: "Sara Khan", avatar: "avatars/sara.jpg" }
       ]
     }
   }
   ========================================================================== */
function fetchGroupDetails(groupHash) {
    const token = ++activeFetchToken;

    groupEmptyStateEl.hidden = true;
    groupProfileEl.hidden = true;
    groupLoadingEl.hidden = false;

    fetch(GROUP_ROUTES.groupDetails(groupHash), {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (token !== activeFetchToken) return; // user dusre group / list par ja chuka hai
            groupLoadingEl.hidden = true;
            if (!data.success) {
                groupEmptyStateEl.hidden = false;
                showToast(data.message || 'Group load nahi ho saka.');
                return;
            }
            renderGroupProfile(data.group);
        })
        .catch(() => {
            if (token !== activeFetchToken) return;
            groupLoadingEl.hidden = true;
            groupEmptyStateEl.hidden = false;
            showToast('Group load karte waqt masla hua.');
        });
}

/* ==========================================================================
   RENDER GROUP PROFILE
   ========================================================================== */
function renderGroupProfile(group) {
    activeGroupId = group.id;
    const isOwner = Number(group.created_by) === Number(window.AUTH_ID);

    groupProfileEl.innerHTML = '';
    groupProfileEl.hidden = false;

    groupProfileEl.appendChild(buildProfileHeader(group, isOwner));
    groupProfileEl.appendChild(buildMembersSection(group, isOwner));

    if (isOwner) {
        groupProfileEl.appendChild(buildDangerZoneSection(group));
    }
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

function buildProfileHeader(group, isOwner) {
    const header = document.createElement('div');
    header.className = 'group-profile-header';

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'group-avatar-wrap';
    const avatar = buildAvatarNode(group.title, group.avatar ?? 'avatars/defaultGroup.png', 'group-avatar-large');
    avatar.id = 'groupAvatarLarge';
    avatarWrap.appendChild(avatar);

    if (isOwner) {
        const overlay = document.createElement('div');
        overlay.className = 'avatar-edit-overlay';

        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.title = 'Avatar upload karein';
        uploadBtn.setAttribute('aria-label', 'Upload avatar');
        uploadBtn.innerHTML = '<i class="bi bi-camera-fill"></i>';
        uploadBtn.addEventListener('click', () => avatarFileInput.click());

        overlay.appendChild(uploadBtn);

        if (group.avatar) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-avatar-btn';
            removeBtn.title = 'Avatar remove karein';
            removeBtn.setAttribute('aria-label', 'Remove avatar');
            removeBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
            removeBtn.addEventListener('click', () => handleRemoveAvatar(group.id));
            overlay.appendChild(removeBtn);
        }

        avatarWrap.appendChild(overlay);

        const avatarFileInput = document.createElement('input');
        avatarFileInput.type = 'file';
        avatarFileInput.accept = 'image/*';
        avatarFileInput.hidden = true;
        avatarFileInput.addEventListener('change', () => {
            const file = avatarFileInput.files[0];
            if (file) handleUploadAvatar(group.id, file);
            avatarFileInput.value = '';
        });
        avatarWrap.appendChild(avatarFileInput);
    }

    header.appendChild(avatarWrap);

    const name = document.createElement('h2');
    name.className = 'group-profile-name';
    name.id = 'groupProfileName';
    name.textContent = group.title;
    header.appendChild(name);

    const meta = document.createElement('p');
    meta.className = 'group-profile-meta';
    meta.textContent = `${group.users.length} members`;
    header.appendChild(meta);

    if (!isOwner) {
        const notice = document.createElement('div');
        notice.className = 'readonly-notice';
        notice.innerHTML = '<i class="bi bi-info-circle"></i> Sirf group admin hi profile edit kar sakta hai';
        header.appendChild(notice);
    }

    return header;
}

function buildMembersSection(group, isOwner) {
    const section = document.createElement('section');
    section.className = 'group-section';

    const title = document.createElement('h3');
    title.className = 'group-section-title';
    title.innerHTML = `Members <span class="count" id="membersCount">${group.users.length}</span>`;
    section.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'member-list';
    list.id = 'memberList';

    group.users.forEach((member) => {
        list.appendChild(buildMemberItem(group, member, isOwner));
    });
    section.appendChild(list);
    return section;
}

function buildMemberItem(group, member, isOwner) {
    const li = document.createElement('li');
    li.className = 'member-item';
    li.dataset.userId = member.id;

    li.appendChild(buildAvatarNode(member.name, member.avatar ?? 'avatars/defaultChat.png', 'avatar'));

    const body = document.createElement('div');
    body.className = 'member-item-body';

    const isSelf = Number(member.id) === Number(window.AUTH_ID);
    const isGroupOwner = Number(member.id) === Number(group.created_by);

    const nameRow = document.createElement('div');
    nameRow.className = 'member-item-name';
    nameRow.innerHTML = `${escapeHtml(member.name)}
    ${isSelf ? '<span class="you-tag">You</span>' : ''}
    ${isGroupOwner ? '<span class="owner-badge">Admin</span>' : ''}`;
    body.appendChild(nameRow);

    li.appendChild(body);

    // Owner can remove any member except themselves.
    if (isOwner && !isSelf) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-member-btn';
        removeBtn.title = 'Group se remove karein';
        removeBtn.setAttribute('aria-label', 'Remove member');
        removeBtn.innerHTML = '<i class="bi bi-person-dash-fill"></i>';
        removeBtn.addEventListener('click', () => handleRemoveMember(group.id, member.id, li));
        li.appendChild(removeBtn);
    }

    return li;
}

// Owner-only: Add Members + Delete Group, ek hi row me barabar barabar
function buildDangerZoneSection(group) {
    const section = document.createElement('section');
    section.className = 'group-section group-danger-zone';

    const title = document.createElement('h3');
    title.className = 'group-section-title';
    title.textContent = 'Danger Zone';
    section.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'group-danger-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-members-btn';
    addBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Add Members';
    addBtn.addEventListener('click', () => openCreateModal('add', group.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger-btn';
    deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Group Delete Karein';
    deleteBtn.addEventListener('click', () => handleDeleteGroup(group.id));

    actions.append(addBtn, deleteBtn);
    section.appendChild(actions);
    return section;
}

/* ==========================================================================
   AVATAR UPLOAD / REMOVE
   ========================================================================== */
function handleUploadAvatar(groupId, file) {
    const formData = new FormData();
    formData.append('groupId', groupId);
    formData.append('avatar', file);

    fetch(GROUP_ROUTES.uploadAvatar, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                Toastify({
                    text: data.message || 'Error uploading avatar.',
                    duration: 1500,
                    gravity: 'top',
                    position: 'right',
                    close: true,
                    stopOnFocus: true,
                    style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
                }).showToast();
                return;
            }
            updateAvatarPreview(data.avatar);
            updateListItemAvatar(groupId, data.avatar);
            Toastify({
                text: data.message || 'Avatar updated.',
                style: {
                    background: '#13B0A7',
                },
                close: true,
                offset: { x: 0, y: 50 },
                position: 'center',
                gravity: 'bottom',
                duration: 1500
            }).showToast();
            fetchGroupDetails(activeGroupHash);
        })
        .catch(() => Toastify({
            text: 'Something went wrong.',
            duration: 1500,
            gravity: 'top',
            position: 'right',
            close: true,
            stopOnFocus: true,
            style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
        }).showToast());
}

function handleRemoveAvatar(groupId) {
    Swal.fire({
        title: "Confirm remove?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e35d5d",
        cancelButtonColor: "#6b8280",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(GROUP_ROUTES.removeAvatar, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ groupId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.success) {
                        Toastify({
                            text: data.message || 'Error deleting avatar.',
                            duration: 1500,
                            gravity: 'top',
                            position: 'right',
                            close: true,
                            stopOnFocus: true,
                            style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
                        }).showToast()
                        return;
                    }
                    updateAvatarPreview(data.defaultAvatar);
                    updateListItemAvatar(groupId, data.defaultAvatar);
                    Toastify({
                        text: data.message || 'Avatar removed.',
                        duration: 1500,
                        gravity: 'bottom',
                        position: 'center',
                        close: true,
                        stopOnFocus: true,
                        offset: { x: 0, y: 10 },
                        style: { background: '#13B0A7', borderRadius: '8px', color: '#fff' },
                    }).showToast()
                    fetchGroupDetails(activeGroupHash);
                })
                .catch(() => Toastify({
                    text: 'Something went wrong.',
                    duration: 1500,
                    gravity: 'top',
                    position: 'right',
                    close: true,
                    stopOnFocus: true,
                    style: { background: '#e35d5d', borderRadius: '8px', color: '#fff' },
                }).showToast());
        }
    });
}

function updateAvatarPreview(avatarUrl) {
    const avatarEl = document.getElementById('groupAvatarLarge');
    if (!avatarEl) return;
    const nameText = document.getElementById('groupProfileName')?.textContent || '';
    avatarEl.innerHTML = '';
    if (avatarUrl) {
        const img = document.createElement('img');
        img.src = assetPath(avatarUrl);
        img.alt = nameText;
        avatarEl.appendChild(img);
    } else {
        avatarEl.textContent = nameText.trim().substring(0, 2).toUpperCase();
    }
}

function updateListItemAvatar(groupId, avatarUrl) {
    const item = groupListEl.querySelector(`.group-item[data-group-id="${groupId}"]`);
    if (!item) return;
    item.dataset.avatar = avatarUrl || '';
    const avatarEl = item.querySelector('.avatar');
    avatarEl.innerHTML = '';
    if (avatarUrl) {
        const img = document.createElement('img');
        img.src = assetPath(avatarUrl);
        img.alt = item.dataset.name;
        avatarEl.appendChild(img);
    } else {
        avatarEl.textContent = item.dataset.name.trim().substring(0, 2).toUpperCase();
    }
}

/* ==========================================================================
   DELETE GROUP (owner only)
   ========================================================================== */
function handleDeleteGroup(groupId) {
    Swal.fire({
        title: "Are you sure?",
        text: "You want to delete this group.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e35d5d",
        cancelButtonColor: "#6b8280",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(GROUP_ROUTES.deleteGroup, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ groupId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.success) {
                        showToast(data.message || 'Error deleting group.');
                        return;
                    }
                    const item = groupListEl.querySelector(`.group-item[data-group-id="${groupId}"]`);
                    if (item) item.remove();

                    // mobile par wapas list screen, desktop par empty state
                    // (replaceState: taake back dabane par delete hua group dobara fetch na ho)
                    history.replaceState({}, '', '/groups');
                    closeGroupProfile();

                    Toastify({
                        text: data.message || 'Group Deleted.',
                        style: {
                            background: '#13B0A7',
                        },
                        close: true,
                        offset: { x: 0, y: 50 },
                        position: 'center',
                        gravity: 'bottom',
                        duration: 1500
                    }).showToast();
                })
                .catch(() => showToast('Error deleting group.'));
        }
    })
}

/* ==========================================================================
   REMOVE MEMBER (owner only)
   ========================================================================== */
function handleRemoveMember(groupId, userId, memberLi) {
    Swal.fire({
        title: "Confirm remove?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e35d5d",
        cancelButtonColor: "#6b8280",
        confirmButtonText: "Yes, remove it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(GROUP_ROUTES.removeMember, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ groupId, userId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.success) {
                        showToast(data.message || 'Error removing member.');
                        return;
                    }
                    memberLi.remove();
                    decrementMembersCount(groupId);
                    Toastify({
                        text: data.message || 'Member removed',
                        style: {
                            background: '#13B0A7',
                        },
                        close: true,
                        offset: { x: 0, y: 50 },
                        position: 'center',
                        gravity: 'bottom',
                        duration: 1500
                    }).showToast();
                })
                .catch(() => showToast('Member remove karte waqt masla hua.'));
        }
    })
}

function decrementMembersCount(groupId) {
    const countBadge = document.getElementById('membersCount');
    const metaText = document.querySelector('.group-profile-meta');
    const memberList = document.getElementById('memberList');
    const newCount = memberList ? memberList.children.length : null;

    if (countBadge && newCount !== null) countBadge.textContent = newCount;
    if (metaText && newCount !== null) metaText.textContent = `${newCount} members`;

    updateListItemMembersCount(groupId, newCount);
}

// Left list ke item par members count update (remove / add dono me use hota hai)
function updateListItemMembersCount(groupId, count) {
    const item = groupListEl.querySelector(`.group-item[data-group-id="${groupId}"]`);
    if (!item || count == null) return;
    item.dataset.membersCount = count;
    const sub = item.querySelector('.group-item-sub');
    if (sub) sub.textContent = `${count} members`;
}

/* ==========================================================================
   CREATE GROUP / ADD MEMBERS MODAL (ek hi modal, do modes)
   mode 'create': + click -> details step -> "Select members" -> contacts
                  (15 per page) -> multi check -> Create -> POST /groups/create
   mode 'add'   : "Add Members" click -> seedha contacts step (group ke
                  existing members exclude) -> Add -> POST /groups/addMembers
   ========================================================================== */
const DEFAULT_GROUP_AVATAR = 'avatars/defaultGroup.png';
const DEFAULT_USER_AVATAR = 'avatars/defaultChat.png';

const CG = {
    mode: 'create',      // 'create' | 'add'
    groupId: null,       // add mode me target group
    page: 1,
    hasMore: true,
    loading: false,
    loaded: false,
    submitting: false,
    selected: new Map(), // id -> {id, name}; pages ke across selection yaad rehti hai
    avatarFile: null,
};

const CG_ROUTES = {
    contacts: (page) => {
        const q = new URLSearchParams({ page });
        // add mode: server ko batao ke is group ke existing members na bheje
        if (CG.mode === 'add' && CG.groupId) q.set('groupId', CG.groupId);
        return `/groups/contacts?${q.toString()}`;
    },
    create: `/groups/create`,
    addMembers: `/groups/addMembers`,
};

const $cg = (id) => document.getElementById(id);

function initCreateGroup() {
    const plusBtn = document.querySelector('.group-list-header-actions .icon-btn');
    if (!plusBtn || !$cg('cgOverlay')) return;

    // arrow fn zaroori hai, warna click event `mode` argument ban jata hai
    plusBtn.addEventListener('click', () => openCreateModal('create'));
    $cg('cgClose').addEventListener('click', closeCreateModal);
    $cg('cgCancel').addEventListener('click', closeCreateModal);
    $cg('cgOverlay').addEventListener('mousedown', (e) => {
        if (e.target === $cg('cgOverlay')) closeCreateModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !$cg('cgOverlay').hidden) closeCreateModal();
    });

    $cg('cgAvatarBtn').addEventListener('click', () => $cg('cgAvatarInput').click());
    $cg('cgAvatarInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        CG.avatarFile = file;
        $cg('cgAvatarPreview').src = URL.createObjectURL(file);
    });

    $cg('cgSelectBtn').addEventListener('click', showContactsStep);
    $cg('cgBack').addEventListener('click', showDetailsStep);
    $cg('cgLoadMore').addEventListener('click', loadContacts);
    $cg('cgStepContacts').addEventListener('scroll', (e) => {
        const el = e.target;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadContacts();
    });
    // mode ke hisab se sahi submit chale
    $cg('cgCreateBtn').addEventListener('click', () => {
        if (CG.mode === 'add') submitAddMembers();
        else submitCreateGroup();
    });
}

function openCreateModal(mode = 'create', groupId = null) {
    resetCreateModal(mode, groupId);
    $cg('cgOverlay').hidden = false;
    if (mode === 'add') showContactsStep(); // details step skip, contacts fetch shuru
    else $cg('cgTitleInput').focus();
}

function closeCreateModal() {
    if (CG.submitting) return;
    $cg('cgOverlay').hidden = true;
}

function resetCreateModal(mode = 'create', groupId = null) {
    CG.mode = mode;
    CG.groupId = groupId;
    CG.page = 1; CG.hasMore = true; CG.loading = false; CG.loaded = false;
    CG.selected.clear(); CG.avatarFile = null;

    $cg('cgTitleInput').value = '';
    $cg('cgAvatarInput').value = '';
    $cg('cgAvatarPreview').src = assetPath(DEFAULT_GROUP_AVATAR);
    $cg('cgContactList').innerHTML = '';
    $cg('cgContactsStatus').textContent = '';
    $cg('cgLoadMore').hidden = true;
    setCgError('');
    updateSelectedCount();
    showDetailsStep();
}

function setCgError(msg) {
    const el = $cg('cgError');
    el.textContent = msg;
    el.hidden = !msg;
}

function updateSelectedCount() {
    const n = CG.selected.size;
    const base = CG.mode === 'add' ? 'Add members' : 'Create group';
    $cg('cgSelectedCount').textContent = n;
    $cg('cgCreateBtn').textContent = n ? `${base} (${n})` : base;
}

function showDetailsStep() {
    $cg('cgStepDetails').hidden = false;
    $cg('cgStepContacts').hidden = true;
    $cg('cgBack').hidden = true;
    $cg('cgHeading').textContent = 'New group';
}

function showContactsStep() {
    $cg('cgStepDetails').hidden = true;
    $cg('cgStepContacts').hidden = false;
    $cg('cgBack').hidden = CG.mode === 'add'; // add mode me details step hai hi nahi
    $cg('cgHeading').textContent = CG.mode === 'add' ? 'Add members' : 'Select members';
    if (!CG.loaded) loadContacts(); // pehli dafa hi request jaye
}

/* ---- Contacts (paginated, 15 per request) ---- */
function loadContacts() {
    if (CG.loading || !CG.hasMore) return;
    CG.loading = true;
    $cg('cgLoadMore').hidden = true;
    $cg('cgContactsStatus').textContent = 'Loading...';

    fetch(CG_ROUTES.contacts(CG.page), {
        headers: { accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
    })
        .then((r) => r.json())
        .then((data) => {
            if (!data.success) throw new Error(data.message);
            CG.loaded = true;
            data.contacts.forEach((c) => $cg('cgContactList').appendChild(buildContactItem(c)));
            CG.hasMore = !!data.has_more;
            CG.page++;
            $cg('cgContactsStatus').textContent =
                !$cg('cgContactList').children.length ? 'No contacts found.' : '';
            $cg('cgLoadMore').hidden = !CG.hasMore;
        })
        .catch(() => {
            $cg('cgContactsStatus').textContent = 'Contacts load nahi ho sake.';
            $cg('cgLoadMore').hidden = false; // retry
        })
        .finally(() => { CG.loading = false; });
}

function buildContactItem(contact) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.className = 'cg-contact-item';

    const av = document.createElement('span');
    av.className = 'avatar';
    const img = document.createElement('img');
    img.src = assetPath(contact.avatar || DEFAULT_USER_AVATAR);
    img.alt = contact.name;
    av.appendChild(img);

    const name = document.createElement('span');
    name.className = 'cg-contact-name';
    name.textContent = contact.name;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = contact.id;
    cb.checked = CG.selected.has(contact.id);
    cb.addEventListener('change', () => {
        if (cb.checked) CG.selected.set(contact.id, { id: contact.id, name: contact.name });
        else CG.selected.delete(contact.id);
        updateSelectedCount();
    });

    label.append(av, name, cb);
    li.appendChild(label);
    return li;
}

/* ---- Final request: CREATE GROUP ---- */
function submitCreateGroup() {
    if (CG.submitting) return;

    const title = $cg('cgTitleInput').value.trim();
    if (!title) {
        showDetailsStep();
        setCgError('Group title zaroori hai.');
        $cg('cgTitleInput').focus();
        return;
    }
    if (CG.selected.size === 0) {
        showContactsStep();
        showToast('Kam az kam ek member select karein.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    if (CG.avatarFile) formData.append('avatar', CG.avatarFile);
    CG.selected.forEach((u) => formData.append('users[]', u.id));

    CG.submitting = true;
    const btn = $cg('cgCreateBtn');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    fetch(CG_ROUTES.create, {
        method: 'POST',
        headers: { accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: formData,
    })
        .then(async (r) => ({ ok: r.ok, data: await r.json() }))
        .then(({ ok, data }) => {
            if (!ok || !data.success) {
                // Laravel validation (422): errors object
                const firstErr = data.errors ? Object.values(data.errors)[0][0] : null;
                showDetailsStep();
                setCgError(firstErr || data.message || 'Group create nahi ho saka.');
                return;
            }
            CG.submitting = false;
            closeCreateModal();
            const item = addGroupListItem(data.group);
            Toastify({
                text: data.message || 'Group created.',
                style: { background: '#13B0A7' },
                close: true, offset: { x: 0, y: 50 },
                position: 'center', gravity: 'bottom', duration: 1500,
            }).showToast();
            setActiveListItem(item);
            openGroup(item, true);
        })
        .catch(() => setCgError('Something went wrong.'))
        .finally(() => {
            CG.submitting = false;
            btn.disabled = false;
            updateSelectedCount();
        });
}

/* ---- Final request: ADD MEMBERS ---- */
function submitAddMembers() {
    if (CG.submitting) return;
    if (CG.selected.size === 0) {
        showToast('Kam az kam ek member select karein.');
        return;
    }

    const groupId = CG.groupId;
    const formData = new FormData();
    formData.append('groupId', groupId);
    CG.selected.forEach((u) => formData.append('users[]', u.id));

    CG.submitting = true;
    const btn = $cg('cgCreateBtn');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    fetch(CG_ROUTES.addMembers, {
        method: 'POST',
        headers: { accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: formData,
    })
        .then(async (r) => ({ ok: r.ok, data: await r.json() }))
        .then(({ ok, data }) => {
            if (!ok || !data.success) {
                const firstErr = data.errors ? Object.values(data.errors)[0][0] : null;
                showToast(firstErr || data.message || 'Members add nahi ho sake.');
                return;
            }
            CG.submitting = false;
            closeCreateModal();
            updateListItemMembersCount(groupId, data.members_count);
            Toastify({
                text: data.message || 'Members added.',
                style: { background: '#13B0A7' },
                close: true, offset: { x: 0, y: 50 },
                position: 'center', gravity: 'bottom', duration: 1500,
            }).showToast();
            // profile dobara load taake naye members list me aa jayen
            if (String(activeGroupId) === String(groupId) && activeGroupHash) {
                fetchGroupDetails(activeGroupHash);
            }
        })
        .catch(() => showToast('Something went wrong.'))
        .finally(() => {
            CG.submitting = false;
            btn.disabled = false;
            updateSelectedCount();
        });
}

// Server se aaya group list ke top par daalo
function addGroupListItem(g) {
    groupListEl.querySelector('.group-empty-list')?.remove();

    const li = document.createElement('li');
    li.className = 'group-item';
    li.dataset.groupId = g.id;
    li.dataset.groupHash = g.chat_hash;
    li.dataset.name = g.title;
    li.dataset.avatar = assetPath(g.avatar || DEFAULT_GROUP_AVATAR);
    li.dataset.createdBy = g.created_by;
    li.dataset.membersCount = g.members_count;

    li.innerHTML = `
      <span class="avatar"><img alt=""></span>
      <div class="group-item-body">
        <div class="group-item-row">
          <span class="group-item-name"></span>
          <span class="group-item-meta"><i class="bi bi-star-fill" style="color:#e8b431;font-size:.72rem;"></i></span>
        </div>
        <div class="group-item-row"><span class="group-item-sub"></span></div>
      </div>`;
    li.querySelector('img').src = li.dataset.avatar;
    li.querySelector('.group-item-name').textContent = g.title;
    li.querySelector('.group-item-sub').textContent = `${g.members_count} members`;

    bindGroupItem(li);
    groupListEl.prepend(li);
    return li;
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