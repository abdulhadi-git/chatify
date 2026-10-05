// Chatify — Profile page
const $ = (id) => document.getElementById(id);

const form = $('profileForm');
const photoInput = $('photoInput');
const avatarImg = $('avatarImg');
const removeBtn = $('removePhotoBtn');
const removeFlag = $('removePhoto');
const saveBtn = $('saveBtn');
const discardBtn = $('discardBtn');
const bio = $('bio');

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const DEFAULT_SRC = avatarImg.dataset.default;

// End points
const ROUTES = {
  updateProfile: `/updateProfile`,
};

// Server ne jo render kiya wahi "original" state hai
let originalPhoto = avatarImg.getAttribute('src');
let originalHasCustom = !removeBtn.hidden; // Blade ne decide kiya

const textFields = ['name', 'username', 'bio', 'phone'].map($);

/* ---------- Toast ---------- */
function toast(msg, icon = 'bi-check-circle-fill') {
  const el = document.createElement('div');
  el.className = 'chatify-toast';
  el.innerHTML = `<i class="bi ${icon}"></i><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ---------- Dirty check (Save + Discard buttons) ---------- */
function isDirty() {
  const textChanged = textFields.some((el) => el.value !== el.defaultValue);
  const photoChanged = photoInput.files.length > 0 || removeFlag.value === '1';
  return textChanged || photoChanged;
}

// Dono buttons ek saath: change hua to enable, warna disable
function updateButtons() {
  const dirty = isDirty();
  saveBtn.disabled = !dirty;
  discardBtn.disabled = !dirty;
}
form.addEventListener('input', updateButtons);
form.addEventListener('change', updateButtons);

/* ---------- Photo ---------- */
// Nayi image upload hone par
function showUploaded(src) {
  avatarImg.src = src;
  removeBtn.hidden = false;
  removeFlag.value = '0'; // nayi photo aa rahi hai, remove nahi
}

// Remove: default image dikhao, remove button chhupao
function clearPhoto() {
  avatarImg.src = DEFAULT_SRC;
  removeBtn.hidden = true;
  photoInput.value = ''; // chuni hui nayi file bhi hata do
  // Server ko remove tabhi batao jab pehle se custom photo thi
  removeFlag.value = originalHasCustom ? '1' : '0';
}

$('changePhotoBtn').addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    photoInput.value = '';
    updateButtons();
    return toast('Choose a JPG, PNG or WebP image.', 'bi-exclamation-circle-fill');
  }
  if (file.size > MAX_SIZE) {
    photoInput.value = '';
    updateButtons();
    return toast('Photo is over 2 MB. Choose a smaller one.', 'bi-exclamation-circle-fill');
  }
  const reader = new FileReader();
  reader.onload = (e) => showUploaded(e.target.result);
  reader.readAsDataURL(file);
});

removeBtn.addEventListener('click', () => {
  clearPhoto();
  updateButtons();
  if (originalHasCustom) toast('Photo removed. Save to apply.', 'bi-trash3');
});

/* ---------- Bio counter ---------- */
function updateCount() { $('bioCount').textContent = bio.value.length; }
bio.addEventListener('input', updateCount);
updateCount();

/* ---------- Validation ---------- */
const rules = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Enter your name (at least 2 characters).'),
  username: (v) => (/^[a-zA-Z0-9._]{3,30}$/.test(v) ? '' : 'Use 3–30 letters, numbers, dots or underscores.'),
  phone: (v) => (!v.trim() || /^\+?[0-9\s\-()]{7,20}$/.test(v) ? '' : 'Enter a valid phone number.'),
};

function validate(field) {
  const input = $(field);
  const msg = rules[field](input.value);
  input.closest('.field').classList.toggle('invalid', !!msg);
  form.querySelector(`.field-error[data-for="${field}"]`).textContent = msg;
  return !msg;
}

Object.keys(rules).forEach((f) => $(f).addEventListener('blur', () => validate(f)));

/* ---------- Build request body ---------- */
function buildFormData() {
  const fd = new FormData(form);

  // Nayi photo: file explicitly attach karo
  const file = photoInput.files[0];
  if (file) {
    fd.set('photo', file, file.name);
  } else {
    fd.delete('photo'); // khali file part na jaye
  }

  // remove_photo sirf tab '1' jab photo hata di ho aur nayi file na ho
  fd.set('remove_photo', !file && removeFlag.value === '1' ? '1' : '0');

  return fd;
}

/* ---------- Submit / Reset ---------- */
// photo ka error bhi toast mein dikhega (us ka koi inline field nahi)
const errorMap = { user_name: 'username', phone_number: 'phone', name: 'name' };

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ok = Object.keys(rules).map(validate).every(Boolean);
  if (!ok) return toast('Fix the highlighted fields.', 'bi-exclamation-circle-fill');

  // Save hote waqt dono band
  saveBtn.disabled = true;
  discardBtn.disabled = true;

  try {
    const res = await fetch(ROUTES.updateProfile, {
      method: 'POST', // _method=PUT form mein @method('PUT') se ja raha hai
      headers: {
        'X-CSRF-TOKEN': window.csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
        // Content-Type khud mat lagao, browser multipart boundary ke saath set karta hai
      },
      body: buildFormData(), // email named field nahi, isliye kabhi nahi jata
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 422) {
      Object.entries(data.errors || {}).forEach(([key, msgs]) => {
        const id = errorMap[key];
        if (!id) return;
        $(id).closest('.field').classList.add('invalid');
        form.querySelector(`.field-error[data-for="${id}"]`).textContent = msgs[0];
      });
      const photoErr = data.errors?.photo?.[0];
      return toast(photoErr || 'Fix the highlighted fields.', 'bi-exclamation-circle-fill');
    }
    if (!res.ok) throw new Error();

    // Agar server ne nayi avatar URL bheji ho to wahi use karo
    // (controller response mein: 'avatar_url' => asset('storage/'.$user->avatar))
    if (data.avatar_url) avatarImg.src = data.avatar_url;

    // Save ke baad current values ko naya "original" bana do
    textFields.forEach((el) => (el.defaultValue = el.value));
    originalPhoto = avatarImg.getAttribute('src');
    originalHasCustom = !removeBtn.hidden;
    photoInput.value = '';
    removeFlag.value = '0';

    toast('Profile saved.');
  } catch {
    toast('Could not save. Try again.', 'bi-exclamation-circle-fill');
  } finally {
    updateButtons(); // changes save ho gaye to dono disabled, warna enabled
  }
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    avatarImg.src = originalPhoto;
    removeBtn.hidden = !originalHasCustom;
    removeFlag.value = '0';
    photoInput.value = '';
    updateCount();
    form.querySelectorAll('.invalid').forEach((f) => f.classList.remove('invalid'));
    form.querySelectorAll('.field-error').forEach((s) => (s.textContent = ''));
    updateButtons();
  });
});

updateButtons();