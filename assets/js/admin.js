const $ = (s) => document.querySelector(s);
let products = [];
let editing = null;
let selectedFiles = [];

const loginStorageKey = 'reginaAdminSession';
const storeConfigKey = 'reginaStoreConfig';
const productsStorageKey = 'reginaProductsList';

const msg = (text, isError = false) => {
  const el = $('#status');
  el.className = 'status ' + (isError ? 'error' : 'ok');
  el.textContent = text;
};

const defaultStoreConfig = {
  storeName: 'Regina Gold',
  storePhone: '01070530886',
  storeAddress: 'مصر الجديدة - شارع التسعين - القاهرة',
  storeMapLink: 'https://maps.google.com/?q=%D9%85%D8%B5%D8%B1+%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86',
  storeMapEmbed: 'https://www.google.com/maps?q=%D9%85%D8%B5%D8%B1%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D8%A7%D8%B1%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86&output=embed',
  telegramToken: (window.REGIA_CONFIG && window.REGIA_CONFIG.telegramBotToken) || '',
  telegramChatIds: ((window.REGIA_CONFIG && window.REGIA_CONFIG.telegramChatIds) || []).join(',')
};

function getRoot() {
  return `https://api.github.com/repos/${$('#owner').value.trim()}/${$('#repo').value.trim()}/contents/`;
}

function getToken() {
  return $('#token').value.trim();
}

function encodeJson(x) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(x, null, 2))));
}

function decodeJson(x) {
  return JSON.parse(decodeURIComponent(escape(atob(x.replace(/\n/g, '')))));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function api(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'GitHub request failed');
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

async function getList() {
  if (!getToken()) {
    return { list: readProductsLocal(), sha: null };
  }
  const data = await api(getRoot() + 'assets/data/products.json');
  return { list: decodeJson(data.content), sha: data.sha };
}

async function saveList(list, sha, message) {
  await api(getRoot() + 'assets/data/products.json', 'PUT', {
    message,
    content: encodeJson(list),
    sha
  });
}

async function existing(path) {
  try {
    return await api(getRoot() + path);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function put(path, content, message) {
  const oldValue = await existing(path);
  const body = { message, content };
  if (oldValue) body.sha = oldValue.sha;
  return api(getRoot() + path, 'PUT', body);
}

function images(product) {
  return Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
}

function imageUrl(path) {
  if (!path) return '0.png';
  if (path.startsWith('http')) return path;
  return `https://raw.githubusercontent.com/${$('#owner').value.trim()}/${$('#repo').value.trim()}/main/${path}`;
}

function renderInventory() {
  const box = $('#inventory');
  box.innerHTML = products.length ? products.map((product) => `
    <article class="item">
      <img src="${imageUrl(images(product)[0])}" alt="${product.name}">
      <h3>${product.name}</h3>
      <small>${product.carat || ''} · ${product.price || 0} ج.م · ${product.availability || ''}</small>
      <div class="item-actions">
        <button class="btn edit" data-id="${product.id}" type="button">تعديل</button>
        <button class="btn ghost del" data-id="${product.id}" type="button">حذف</button>
      </div>
    </article>
  `).join('') : '<p>لا توجد منتجات.</p>';

  document.querySelectorAll('.edit').forEach((button) => {
    button.onclick = () => edit(button.dataset.id);
  });

  document.querySelectorAll('.del').forEach((button) => {
    button.onclick = () => remove(button.dataset.id);
  });
}

function readProductsLocal() {
  try {
    const local = JSON.parse(localStorage.getItem(productsStorageKey) || '[]');
    return Array.isArray(local) ? local : [];
  } catch {
    return [];
  }
}

function persistProductsLocal(list) {
  localStorage.setItem(productsStorageKey, JSON.stringify(list || []));
}

function readStoreConfigFromLocal() {
  try {
    const local = JSON.parse(localStorage.getItem(storeConfigKey) || '{}');
    return { ...defaultStoreConfig, ...local };
  } catch {
    return { ...defaultStoreConfig };
  }
}

function persistStoreConfigLocal(data) {
  localStorage.setItem(storeConfigKey, JSON.stringify(data));
}

function applyStoreConfigForm(data) {
  $('#storeName').value = data.storeName || defaultStoreConfig.storeName;
  $('#storePhone').value = data.storePhone || defaultStoreConfig.storePhone;
  $('#storeAddress').value = data.storeAddress || defaultStoreConfig.storeAddress;
  $('#storeMapLink').value = data.storeMapLink || defaultStoreConfig.storeMapLink;
  $('#storeMapEmbed').value = data.storeMapEmbed || defaultStoreConfig.storeMapEmbed;
  $('#telegramToken').value = data.telegramToken || '';
  $('#telegramChatIds').value = data.telegramChatIds || '';
}

async function loadStoreConfig() {
  const localData = readStoreConfigFromLocal();
  applyStoreConfigForm(localData);

  if (!getToken()) return;

  try {
    const data = await existing('assets/data/store-config.json');
    if (data && data.content) {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
      const merged = { ...defaultStoreConfig, ...parsed };
      applyStoreConfigForm(merged);
      persistStoreConfigLocal(merged);
    }
  } catch {
    // ignore and reuse local fallback
  }
}

async function saveStoreConfig() {
  const data = {
    storeName: $('#storeName').value.trim() || defaultStoreConfig.storeName,
    storePhone: $('#storePhone').value.trim() || defaultStoreConfig.storePhone,
    storeAddress: $('#storeAddress').value.trim() || defaultStoreConfig.storeAddress,
    storeMapLink: $('#storeMapLink').value.trim() || defaultStoreConfig.storeMapLink,
    storeMapEmbed: $('#storeMapEmbed').value.trim() || defaultStoreConfig.storeMapEmbed,
    telegramToken: $('#telegramToken').value.trim(),
    telegramChatIds: $('#telegramChatIds').value.trim()
  };

  persistStoreConfigLocal(data);

  if (!getToken()) {
    msg('تم حفظ إعدادات المتجر محليا فقط. أدخلي GitHub Token للنشر.');
    return;
  }

  try {
    const encoded = encodeJson(data);
    await put('assets/data/store-config.json', encoded, 'Update store config');
    msg('تم حفظ إعدادات المتجر بنجاح.');
  } catch (error) {
    msg(`تعذر حفظ إعدادات المتجر: ${error.message}`, true);
  }
}

function renderSelectedImages(files) {
  const preview = $('#imagePreview');
  if (!preview) return;

  preview.innerHTML = '';

  files.slice(0, 8).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const box = document.createElement('div');
      box.className = 'img-preview';
      box.innerHTML = `<img src="${event.target.result}" alt="preview">`;
      preview.appendChild(box);
    };
    reader.readAsDataURL(file);
  });
}

$('#images').addEventListener('change', (event) => {
  selectedFiles = Array.from(event.target.files).slice(0, 8);
  renderSelectedImages(selectedFiles);
});

function showLoginView() {
  $('#login').classList.remove('hidden');
  $('#admin').classList.add('hidden');
}

function showAdminView() {
  $('#login').classList.add('hidden');
  $('#admin').classList.remove('hidden');
}

function restoreLoginSession() {
  try {
    const state = JSON.parse(localStorage.getItem(loginStorageKey) || 'null');
    if (state && state.loggedIn) {
      $('#user').value = state.user || 'admin';
      $('#pass').value = state.pass || 'admin.Com1';
      showAdminView();
      return;
    }
  } catch {
    // no session
  }

  showLoginView();
}

$('#loginForm').onsubmit = (event) => {
  event.preventDefault();
  const user = $('#user').value.trim();
  const pass = $('#pass').value.trim();

  if (user === 'admin' && pass === 'admin.Com1') {
    localStorage.setItem(loginStorageKey, JSON.stringify({ loggedIn: true, user, pass }));
    showAdminView();
    $('#loginError').textContent = '';
  } else {
    $('#loginError').textContent = 'بيانات الدخول غير صحيحة.';
  }
};

$('#logoutBtn').onclick = () => {
  localStorage.removeItem(loginStorageKey);
  showLoginView();
  $('#pass').value = '';
};

$('#loadProducts').onclick = async () => {
  try {
    const result = await getList();
    products = Array.isArray(result.list) ? result.list : [];
    persistProductsLocal(products);
    renderInventory();
    msg('تم تحميل المنتجات.');
  } catch (error) {
    products = readProductsLocal();
    renderInventory();
    msg(`تعذر التحميل: ${error.message}`, true);
  }
};

function edit(id) {
  editing = products.find((product) => product.id === id);
  if (!editing) return;

  const product = editing;
  $('#formTitle').textContent = `تعديل: ${product.name}`;
  $('#category').value = product.category || 'rings';
  $('#number').value = product.id.split('-').slice(1).join('-');
  ['name', 'carat', 'price', 'salePrice', 'saleEnds', 'manufacturing', 'weight', 'availability', 'shipping', 'description'].forEach((key) => {
    const el = $('#' + key);
    if (el) el.value = product[key] ?? '';
  });
  $('#customOrder').value = String(product.customOrder ?? true);
  $('#imagePreview').innerHTML = '';
  selectedFiles = [];
  const previewList = images(product);
  previewList.forEach((src) => {
    const img = document.createElement('img');
    img.src = imageUrl(src);
    const wrapper = document.createElement('div');
    wrapper.className = 'img-preview';
    wrapper.appendChild(img);
    $('#imagePreview').appendChild(wrapper);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('#resetForm').onclick = () => {
  editing = null;
  $('#productForm').reset();
  $('#imagePreview').innerHTML = '';
  selectedFiles = [];
  $('#formTitle').textContent = 'إضافة صنف جديد';
};

async function sendTelegramProductUpdate(productName, action) {
  const token = $('#telegramToken').value.trim();
  const ids = ($('#telegramChatIds').value || '').split(',').map((item) => item.trim()).filter(Boolean);

  if (!token || !ids.length) return;

  const text = `🛍️ تحديث المتجر\nالإجراء: ${action}\nالمنتج: ${productName}\nالوقت: ${new Date().toLocaleString('ar-EG')}`;

  for (const chatId of ids) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
      });
    } catch {
      // ignore Telegram errors silently
    }
  }
}

$('#productForm').onsubmit = async (event) => {
  event.preventDefault();

  try {
    if (!getToken()) {
      throw new Error('أدخلي GitHub Token أولا.');
    }

    const category = $('#category').value;
    const num = $('#number').value.trim();
    if (!/^\d+$/.test(num)) {
      throw new Error('رقم الصنف يجب أن يحتوي أرقاما فقط.');
    }

    const id = `${category}-${num}`;
    const base = `products/${category}/${num}`;
    let paths = editing && editing.id === id ? images(editing) : [];
    const files = Array.from($('#images').files || []).slice(0, 8);

    msg('جار حفظ المنتج…');

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${base}/${Date.now()}-${safeName}`;
      await put(path, await readFileAsBase64(file), `Upload image for ${id}`);
      paths.push(path);
    }

    if (!paths.length) {
      throw new Error('أضيفي صورة واحدة على الأقل.');
    }

    const product = {
      id,
      name: $('#name').value.trim(),
      carat: $('#carat').value,
      price: Number($('#price').value),
      salePrice: $('#salePrice').value === '' ? '' : Number($('#salePrice').value),
      saleEnds: $('#saleEnds').value,
      manufacturing: $('#manufacturing').value === '' ? '' : Number($('#manufacturing').value),
      weight: $('#weight').value,
      availability: $('#availability').value,
      shipping: $('#shipping').value,
      customOrder: $('#customOrder').value === 'true',
      description: $('#description').value.trim(),
      category,
      image: paths[0],
      images: [...new Set(paths)]
    };

    await put(`${base}/product.json`, encodeJson(product), `Save ${id}`);

    const current = await getList();
    products = current.list.filter((item) => item.id !== id && item.id !== (editing && editing.id));
    products.push(product);
    persistProductsLocal(products);
    if (current.sha && getToken()) {
      await saveList(products, current.sha, `Publish ${product.name}`);
    }

    await sendTelegramProductUpdate(product.name, editing ? 'تعديل' : 'إضافة');

    editing = null;
    $('#productForm').reset();
    $('#imagePreview').innerHTML = '';
    selectedFiles = [];
    $('#formTitle').textContent = 'إضافة صنف جديد';
    renderInventory();
    msg('تم الحفظ والنشر بنجاح.');
  } catch (error) {
    msg(`تعذر الحفظ: ${error.message}`, true);
  }
};

async function remove(id) {
  if (!confirm('حذف هذا الصنف من المتجر')) return;

  const next = products.filter((product) => product.id !== id);
  products = next;
  persistProductsLocal(products);
  renderInventory();

  try {
    const current = await getList();
    const remoteNext = (current.list || []).filter((product) => product.id !== id);

    if (current.sha && getToken()) {
      await saveList(remoteNext, current.sha, `Remove ${id}`);
      msg('تم حذف الصنف من المتجر.');
    } else {
      msg('تم حذف المنتج محليًا، وسيتم تحديث المستودع عند إدخال بيانات GitHub الصحيحة.');
    }

    await sendTelegramProductUpdate(id, 'حذف');
  } catch (error) {
    msg(`تم حذف المنتج من الواجهة، لكن تحديث المستودع فشل: ${error.message}`, true);
  }
}

$('#saveStoreConfig').onclick = saveStoreConfig;

window.onload = async () => {
  applyStoreConfigForm(readStoreConfigFromLocal());
  restoreLoginSession();
  await loadStoreConfig();
  if ($('#admin') && !$('#admin').classList.contains('hidden')) {
    $('#loadProducts').click();
  }
};
