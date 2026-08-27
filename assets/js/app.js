const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const DEFAULT_STORE = {
  storeName: 'Regina Gold',
  phone: '01070530886',
  address: 'مصر الجديدة - شارع التسعين - القاهرة',
  mapEmbed: 'https://www.google.com/maps?q=%D9%85%D8%B5%D8%B1%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86&output=embed',
  mapLink: 'https://maps.google.com/?q=%D9%85%D8%B5%D8%B1+%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86'
};

let all = [];
let cart = [];
let storeConfig = { ...DEFAULT_STORE };
const productsStorageKey = 'reginaProductsList';

function loadSavedProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(productsStorageKey) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSavedCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem('reginaCart') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

cart = loadSavedCart();

function saveCart() {
  localStorage.setItem('reginaCart', JSON.stringify(cart));
  const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const cartCount = $('#cartCount');
  if (cartCount) cartCount.textContent = String(count);
}

function productImages(product) {
  return Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
}

function salePrice(product) {
  const price = Number(product.price || 0);
  const sale = Number(product.salePrice || 0);
  const active = !product.saleEnds || new Date(product.saleEnds) > new Date();
  return active && sale > 0 && sale < price ? sale : price;
}

function normalizeStoreConfig(data) {
  return { ...DEFAULT_STORE, ...(data || {}) };
}

function applyStoreConfig(data) {
  storeConfig = normalizeStoreConfig(data);
  const addressNode = $('#storeAddress');
  if (addressNode) addressNode.textContent = storeConfig.address;

  const mapEl = $('#storeMap');
  if (mapEl) {
    mapEl.src = storeConfig.mapEmbed || DEFAULT_STORE.mapEmbed;
  }
}

async function initStoreConfig() {
  try {
    const local = localStorage.getItem('reginaStoreConfig');
    if (local) {
      applyStoreConfig(JSON.parse(local));
    }
  } catch {
    // ignore invalid local config
  }

  try {
    const response = await fetch('assets/data/store-config.json', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      applyStoreConfig(data);
      localStorage.setItem('reginaStoreConfig', JSON.stringify(data));
    }
  } catch {
    // fallback to local/default config
  }
}

function loadTheme() {
  const theme = localStorage.getItem('reginaTheme');
  if (theme === 'light') document.body.classList.add('light');
}

function renderCategories(categories) {
  const container = $('#categories');
  if (!container) return;

  const icons = ['fa-solid fa-ring', 'fa-solid fa-link', 'fa-solid fa-gem', 'fa-regular fa-gem', 'fa-solid fa-layer-group', 'fa-solid fa-star', 'fa-solid fa-bars-staggered', 'fa-solid fa-coins', 'fa-solid fa-heart', 'fa-regular fa-clock'];

  container.innerHTML = categories.map((category, index) => `
    <a class="category reveal" href="#shop" data-cat="${category.id}">
      <span class="icon"><i class="${icons[index] || 'fa-solid fa-gem'}"></i></span>
      <span>${category.name}</span>
    </a>
  `).join('');

  document.querySelectorAll('[data-cat]').forEach((button) => {
    button.onclick = () => {
      const filter = $('#categoryFilter');
      if (filter) {
        filter.value = button.dataset.cat;
        filterProducts();
      }
    };
  });
}

function renderProducts(items) {
  const productsRoot = $('#products');
  if (!productsRoot) return;

  if (!items.length) {
    productsRoot.innerHTML = '<div class="empty">لا توجد قطع مطابقة للبحث.</div>';
    return;
  }

  productsRoot.innerHTML = items.map((product) => {
    const images = productImages(product);
    const price = salePrice(product);
    const oldPrice = Number(product.price || 0) > Number(price || 0) ? money(product.price) : '';
    const tagTxt = product.availability || 'متوفر';

    return `
      <article class="card reveal" data-detail="${product.id}">
        <img src="${images[0] || '0.png'}" alt="${product.name}" loading="lazy">
        <div class="card-body">
          <div class="tags">
            <span class="tag">${product.carat || ''}</span>
            <span class="tag">${tagTxt}</span>
            <span class="tag">${product.shipping || 'متوفر شحن'}</span>
          </div>
          <h3>${product.name}</h3>
          <p class="desc">${product.description || ''}</p>
          <div class="price">
            ${money(price)}
            ${oldPrice ? `<span class="old-price">${oldPrice}</span>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn add" data-id="${product.id}" type="button">أضيفي للسلة</button>
            <button class="btn ghost buy" data-id="${product.id}" type="button">شراء مباشر</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.add').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      addToCart(button.dataset.id);
    };
  });

  document.querySelectorAll('.buy').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const product = all.find((item) => item.id === button.dataset.id);
      if (product) openOrder([product]);
    };
  });

  document.querySelectorAll('[data-detail]').forEach((card) => {
    card.onclick = () => showDetail(all.find((product) => product.id === card.dataset.detail));
  });
}

function filterProducts() {
  const search = $('#search')?.value.toLowerCase() || '';
  const category = $('#categoryFilter')?.value || '';
  const carat = $('#caratFilter')?.value || '';
  const priceRange = $('#priceFilter')?.value || '';

  let filtered = all.filter((product) => {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase();
    let valid = text.includes(search);
    if (category && product.category !== category) valid = false;
    if (carat && product.carat !== carat) valid = false;

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      const value = salePrice(product);
      valid = valid && value >= min && (Number.isNaN(max) || value <= max);
    }

    return valid;
  });

  const resultText = $('#resultText');
  if (resultText) resultText.textContent = `${filtered.length} قطعة متاحة`;

  renderProducts(filtered);
}

function addToCart(id) {
  const product = all.find((item) => item.id === id);
  if (!product) return;

  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  renderCart();
}

function renderCart() {
  saveCart();
  const cartItems = $('#cartItems');
  const totalText = $('#total');

  if (!cartItems || !totalText) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p>السلة فارغة.</p>';
    totalText.textContent = 'الإجمالي: 0 ج.م';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-row">
      <div>
        <strong>${item.name}</strong>
        <div class="cart-quantity">
          <button type="button" data-qty="${item.id}" data-delta="-1">−</button>
          <span>${item.qty || 1}</span>
          <button type="button" data-qty="${item.id}" data-delta="1">+</button>
        </div>
      </div>
      <span>${money((salePrice(item) || 0) * (item.qty || 1))}</span>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + (salePrice(item) * (item.qty || 1)), 0);
  totalText.textContent = `الإجمالي: ${money(subtotal)}`;

  document.querySelectorAll('[data-qty]').forEach((button) => {
    button.onclick = () => {
      const id = button.dataset.qty;
      const delta = Number(button.dataset.delta || 0);
      const target = cart.find((item) => item.id === id);
      if (!target) return;
      target.qty = (Number(target.qty) || 1) + delta;
      if (target.qty <= 0) {
        cart = cart.filter((item) => item.id !== id);
      }
      renderCart();
    };
  });
}

function showDetail(product) {
  if (!product) return;
  const images = productImages(product);
  const detailImage = $('#detailImage');
  const detailGallery = $('#detailGallery');
  const detailTags = $('#detailTags');
  const detailDescription = $('#detailDescription');
  const detailPrice = $('#detailPrice');
  const detailStock = $('#detailStock');

  if (!detailImage || !detailGallery || !detailTags || !detailDescription || !detailPrice || !detailStock) return;

  detailImage.src = images[0] || '0.png';
  detailGallery.innerHTML = images.map((src) => `<img src="${src}" alt="${product.name}" loading="lazy">`).join('');
  detailGallery.querySelectorAll('img').forEach((img) => {
    img.onclick = () => { detailImage.src = img.src; };
  });

  detailTags.innerHTML = `
    <span class="tag">${product.carat || ''}</span>
    <span class="tag">${product.weight || ''}</span>
    <span class="tag">${product.availability || 'متوفر'}</span>
  `;

  detailDescription.textContent = product.description || '';
  const currentPrice = salePrice(product);
  const old = Number(product.price || 0) > Number(currentPrice || 0) ? ` <span class="old-price">${money(product.price)}</span>` : '';
  detailPrice.innerHTML = `${money(currentPrice)}${old}`;
  detailStock.textContent = product.availability === 'غير متوفر الآن' ? 'غير متوفر الآن يمكنك الطلب المخصص.' : (product.shipping || 'متوفر شحن');

  const modal = $('#detailModal');
  if (modal) modal.classList.add('show');

  const addBtn = $('#detailAdd');
  const buyBtn = $('#detailBuy');
  if (addBtn) addBtn.onclick = () => { addToCart(product.id); modal.classList.remove('show'); };
  if (buyBtn) buyBtn.onclick = () => { modal.classList.remove('show'); openOrder([product]); };
}

function openOrder(items) {
  const modal = $('#orderModal');
  const intro = $('#orderIntro');
  if (!modal || !intro) return;

  const safeItems = items.filter(Boolean);
  intro.textContent = safeItems.map((item) => `${item.name}${item.qty ? ` × ${item.qty}` : ''}`).join(' ');
  modal.dataset.items = JSON.stringify(safeItems);
  modal.classList.add('show');
}

function getBotConfig() {
  const config = window.REGIA_CONFIG || {};
  const token = String(config.telegramBotToken || '').trim();
  const ids = Array.isArray(config.telegramChatIds) ? config.telegramChatIds.filter(Boolean).map(String) : [];
  return { token, ids };
}

function buildTelegramMessage(data) {
  const lines = ['👑 طلب شراء جديد - دار ريجينا جولد', '━━━━━━━━━━━━━━━━━━'];
  lines.push(`رقم الطلب: ${data.orderNumber}`);
  lines.push(`التاريخ والوقت: ${data.orderedAt}`);
  lines.push('', '👤 بيانات العميل:', `• الاسم: ${data.name || '—'}`, `• الهاتف: ${data.phone || '—'}`);
  lines.push(`• الهاتف الإضافي: ${data.secondaryPhone || '—'}`, `• البريد: ${data.email || 'غير مذكور'}`);
  lines.push(`• المحافظة: ${data.governorate || '—'}`, `• العنوان: ${data.address || '—'}`);
  lines.push(`• طريقة الدفع: ${data.payment || '—'}`, `• الملاحظات: ${data.notes || '—'}`, '', '💎 الطلب:');

  data.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name} — ${money(salePrice(item))} × ${item.qty || 1}`);
  });

  lines.push('', '━━━━━━━━━━━━━━━━━━', `المجموع: ${money(data.total || 0)}`);
  return lines.join('\n');
}

async function sendOrderToTelegram(message) {
  const { token, ids } = getBotConfig();
  if (!token || !ids.length) return false;

  let success = false;
  for (const chatId of ids) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(chatId), text: message, disable_web_page_preview: true })
      });
      const payload = await response.json().catch(() => ({ ok: false }));
      success = success || Boolean(payload.ok);
    } catch {
      // ignore
    }
  }

  return success;
}

$('#orderForm').onsubmit = async (event) => {
  event.preventDefault();

  const modal = $('#orderModal');
  const items = JSON.parse(modal.dataset.items || '[]');
  const payload = {
    orderNumber: `REG-${Date.now().toString().slice(-6)}`,
    orderedAt: new Date().toLocaleString('ar-EG'),
    name: $('#customerName').value.trim(),
    phone: $('#phone').value.trim(),
    secondaryPhone: $('#secondaryPhone').value.trim(),
    email: $('#email').value.trim(),
    governorate: $('#governorate')?.value || '—',
    area: $('#area')?.value || '—',
    address: $('#address').value.trim(),
    payment: $('#payment').value,
    notes: $('#notes').value.trim(),
    items,
    total: items.reduce((sum, item) => sum + (salePrice(item) * (item.qty || 1)), 0)
  };

  const message = buildTelegramMessage(payload);
  await sendOrderToTelegram(message);
  cart = [];
  renderCart();
  modal.classList.remove('show');
  $('#orderForm').reset();
  alert('تم إرسال الطلب بنجاح وسنقوم بالتواصل معك في أقرب وقت.');
};

async function init() {
  loadTheme();
  await initStoreConfig();

  const categoriesResponse = await fetch('assets/data/categories.json');
  const productsResponse = await fetch('assets/data/products.json');
  const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
  const storedProducts = loadSavedProducts();
  const fetchedProducts = productsResponse.ok ? await productsResponse.json() : [];
  all = storedProducts.length ? storedProducts : fetchedProducts;

  if (Array.isArray(all) && all.length) {
    localStorage.setItem(productsStorageKey, JSON.stringify(all));
  }

  const categoryFilter = $('#categoryFilter');
  const caratFilter = $('#caratFilter');
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">كل الفئات</option>' + categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join('');
  }

  if (caratFilter) {
    const carats = [...new Set(all.map((product) => product.carat).filter(Boolean))];
    caratFilter.innerHTML = '<option value="">كل العيارات</option>' + carats.map((value) => `<option value="${value}">${value}</option>`).join('');
  }

  renderCategories(categories);
  filterProducts();
  renderCart();

  ['search', 'categoryFilter', 'caratFilter', 'priceFilter'].forEach((id) => {
    const element = $('#' + id);
    if (element) element.oninput = filterProducts;
  });

  const filterToggle = $('#filterToggle');
  const filterPanel = $('#filterPanel');
  if (filterToggle && filterPanel) {
    filterToggle.onclick = () => filterPanel.classList.toggle('open');
  }

  const themeButton = $('#theme');
  if (themeButton) {
    themeButton.onclick = () => {
      document.body.classList.toggle('light');
      localStorage.setItem('reginaTheme', document.body.classList.contains('light') ? 'light' : 'dark');
    };
  }

  const menu = $('#menu');
  const side = $('#side');
  if (menu && side) {
    menu.onclick = () => side.classList.add('open');
    document.querySelectorAll('[data-sideclose]').forEach((button) => {
      button.onclick = () => side.classList.remove('open');
    });
  }

  const closeButtons = document.querySelectorAll('[data-close]');
  closeButtons.forEach((button) => {
    button.onclick = () => button.closest('.overlay')?.classList.remove('show');
  });

  const cartButton = $('#cartButton');
  const cartModal = $('#cartModal');
  if (cartButton && cartModal) {
    cartButton.onclick = () => cartModal.classList.add('show');
  }

  const checkoutButton = $('#checkout');
  if (checkoutButton) {
    checkoutButton.onclick = () => {
      if (!cart.length) {
        alert('سلة المشتريات فارغة.');
        return;
      }
      cartModal.classList.remove('show');
      openOrder(cart);
    };
  }

  const revealItems = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
}

window.addEventListener('load', init);
