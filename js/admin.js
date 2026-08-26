const loginView = document.getElementById('loginView');
const dashView = document.getElementById('dashView');
const logoutBtn = document.getElementById('logoutBtn');
const configWarn = document.getElementById('configWarn');
const loginError = document.getElementById('loginError');
const adminUserLabel = document.getElementById('adminUserLabel');
const toastEl = document.getElementById('toast');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const imagePreview = document.getElementById('imagePreview');
const productImageFile = document.getElementById('productImageFile');

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  done: 'Terminée',
  cancelled: 'Annulée'
};

let productsCache = [];
let ordersCache = [];
let selectedFile = null;
let previewUrl = null;
let editingId = null;
let toastTimer = null;

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtPrice(n) { return Number(n || 0).toLocaleString('fr-FR') + ' F'; }
function fmtDate(iso) {
  try { return new Date(iso).toLocaleString('fr-FR'); }
  catch { return escapeHtml(iso); }
}

function toast(msg, type = 'ok') {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden', 'ok', 'err');
  toastEl.classList.add(type === 'err' ? 'err' : 'ok');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2500);
}

function stockBadge(stock) {
  if (stock <= 0) return '<span class="badge out">Rupture</span>';
  if (stock <= 10) return `<span class="badge low">Stock ${stock}</span>`;
  return `<span class="badge ok">Stock ${stock}</span>`;
}

function slugifyId(name, category) {
  const base = String(name || 'produit')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'produit';
  return `${(category || 'p').slice(0, 2)}-${base}-${Date.now().toString(36).slice(-4)}`;
}

function productImg(p) {
  return p.image_url || 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg';
}

function showDash(on, email) {
  loginView.classList.toggle('hidden', on);
  dashView.classList.toggle('hidden', !on);
  adminUserLabel.textContent = on ? (email || '') : '';
}

function setPreview(src) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  if (!src) {
    imagePreview.innerHTML = '<span>Aperçu image</span>';
    return;
  }
  imagePreview.innerHTML = `<img src="${encodeURI(src)}" alt="Aperçu">`;
}

function openModal(product = null) {
  editingId = product?.id || null;
  selectedFile = null;
  productForm.reset();
  document.getElementById('productFormTitle').textContent = product ? 'Modifier le produit' : 'Nouveau produit';
  document.getElementById('productFormStatus').textContent = '';
  productImageFile.value = '';

  if (product) {
    productForm.id.value = product.id;
    productForm.name.value = product.name || '';
    productForm.category.value = product.category || 'burgers';
    productForm.price.value = product.price ?? 0;
    productForm.stock.value = product.stock ?? 0;
    productForm.weight.value = product.weight || '';
    productForm.brand.value = product.brand || 'Esamaï';
    productForm.description.value = product.description || '';
    productForm.tag.value = (product.tags && product.tags[0]) || '';
    productForm.active.checked = product.active !== false;
    setPreview(product.image_url || null);
  } else {
    productForm.id.value = '';
    productForm.brand.value = 'Esamaï';
    productForm.stock.value = 20;
    productForm.active.checked = true;
    setPreview(null);
  }

  productModal.classList.remove('hidden');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
  selectedFile = null;
  setPreview(null);
}

async function boot() {
  const hint = window.ESAMAI_CONFIG?.adminEmailHint;
  if (hint) document.getElementById('loginEmail').placeholder = hint;

  if (!window.EsamiApi || !EsamiApi.isReady()) {
    configWarn.classList.remove('hidden');
    return;
  }
  const session = await EsamiApi.adminSession();
  if (session) {
    showDash(true, session.user?.email);
    await Promise.all([loadProducts(), loadOrders()]);
  } else {
    showDash(false);
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Connexion...';
  try {
    const data = await EsamiApi.adminSignIn(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPassword').value
    );
    showDash(true, data.user?.email);
    await Promise.all([loadProducts(), loadOrders()]);
    toast('Connecté');
  } catch (err) {
    loginError.textContent = err.message || 'Connexion impossible';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Connexion';
  }
});

logoutBtn.addEventListener('click', async () => {
  await EsamiApi.adminSignOut();
  showDash(false);
  toast('Déconnecté');
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('productsTab').classList.toggle('hidden', tab !== 'products');
    document.getElementById('ordersTab').classList.toggle('hidden', tab !== 'orders');
  });
});

document.getElementById('openCreateBtn').addEventListener('click', () => openModal());
productModal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));

productImageFile.addEventListener('change', () => {
  const file = productImageFile.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Choisis une image valide', 'err');
    return;
  }
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  setPreview(previewUrl);
});

function fillCategoryFilter() {
  const select = document.getElementById('productCatFilter');
  const cats = [...new Set(productsCache.map(p => p.category))].sort();
  const current = select.value || 'all';
  select.innerHTML = `<option value="all">Toutes catégories</option>` +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  select.value = cats.includes(current) ? current : 'all';
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const q = (document.getElementById('productSearch').value || '').trim().toLowerCase();
  const cat = document.getElementById('productCatFilter').value || 'all';
  const rows = productsCache.filter(p => {
    const matchCat = cat === 'all' || p.category === cat;
    const hay = `${p.name} ${p.id} ${p.category}`.toLowerCase();
    return matchCat && (!q || hay.includes(q));
  });

  if (!rows.length) {
    grid.innerHTML = `<p class="hint">Aucun produit.</p>`;
    return;
  }

  grid.innerHTML = rows.map(p => `
    <article class="product-card" data-id="${escapeHtml(p.id)}">
      <img src="${escapeHtml(productImg(p))}" alt="${escapeHtml(p.name)}" loading="lazy">
      <div class="body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="meta">${escapeHtml(p.category)}${p.active === false ? ' · masqué' : ''}</div>
        <div class="price">${fmtPrice(p.price)}</div>
        <div>${stockBadge(Number(p.stock))}</div>
        <div class="card-actions">
          <button class="btn ghost edit-btn" type="button">Modifier</button>
          <button class="btn danger delete-btn" type="button">Suppr.</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.product-card').dataset.id;
      const product = productsCache.find(p => p.id === id);
      if (product) openModal(product);
    });
  });

  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.product-card');
      const id = card.dataset.id;
      const product = productsCache.find(p => p.id === id);
      if (!confirm(`Supprimer « ${product?.name || id} » ?`)) return;
      try {
        await EsamiApi.adminDeleteProduct(id);
        productsCache = productsCache.filter(p => p.id !== id);
        fillCategoryFilter();
        renderProducts();
        toast('Produit supprimé');
      } catch (err) {
        toast(err.message || 'Suppression impossible', 'err');
      }
    });
  });
}

async function loadProducts() {
  const status = document.getElementById('productsStatus');
  status.textContent = 'Chargement...';
  try {
    productsCache = await EsamiApi.adminFetchProducts();
    fillCategoryFilter();
    renderProducts();
    status.textContent = `${productsCache.length} produit(s)`;
  } catch (err) {
    status.textContent = err.message || 'Erreur produits';
    toast(status.textContent, 'err');
  }
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const filter = document.getElementById('orderStatusFilter').value || 'all';
  const orders = ordersCache.filter(o => filter === 'all' || o.status === filter);
  if (!orders.length) {
    list.innerHTML = `<p class="hint">Aucune commande.</p>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const items = (o.order_items || []).map(i =>
      `<li>${escapeHtml(i.product_name)} × ${Number(i.qty)} — <strong>${fmtPrice(i.line_total)}</strong></li>`
    ).join('');
    const phone = String(o.customer_phone || '').replace(/\D/g, '');
    const wa = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent('Bonjour, concernant votre commande Esamaï #' + String(o.id).slice(0, 8))}`
      : null;
    return `
      <article class="order-card" data-id="${escapeHtml(o.id)}">
        <div class="order-top">
          <div>
            <div class="order-id">#${escapeHtml(String(o.id).slice(0, 8))}</div>
            <div class="order-meta">${fmtDate(o.created_at)} · ${fmtPrice(o.total)}</div>
            <div class="order-meta">${escapeHtml(o.customer_name || 'Client')} · ${escapeHtml(o.customer_phone || '—')}</div>
          </div>
          <span class="status-pill ${escapeHtml(o.status)}">${escapeHtml(STATUS_LABELS[o.status] || o.status)}</span>
        </div>
        <ul class="order-items">${items}</ul>
        <div class="order-foot">
          <select data-status>
            ${Object.keys(STATUS_LABELS).map(s =>
              `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`
            ).join('')}
          </select>
          <button class="btn ghost save-status" type="button">Maj statut</button>
          ${wa ? `<a class="btn primary" href="${escapeHtml(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('.save-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.order-card');
      const id = card.dataset.id;
      const statusVal = card.querySelector('[data-status]').value;
      btn.disabled = true;
      try {
        const updated = await EsamiApi.adminUpdateOrderStatus(id, statusVal);
        const idx = ordersCache.findIndex(o => o.id === id);
        if (idx >= 0) ordersCache[idx] = { ...ordersCache[idx], ...updated };
        renderOrders();
        toast('Statut mis à jour');
      } catch (err) {
        toast(err.message || 'Erreur statut', 'err');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function loadOrders() {
  const status = document.getElementById('ordersStatus');
  status.textContent = 'Chargement...';
  try {
    ordersCache = await EsamiApi.adminFetchOrders();
    renderOrders();
    status.textContent = `${ordersCache.length} commande(s)`;
  } catch (err) {
    status.textContent = err.message || 'Erreur commandes';
    toast(status.textContent, 'err');
  }
}

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('productFormStatus');
  const btn = document.getElementById('saveProductBtn');
  const data = new FormData(productForm);
  const name = String(data.get('name') || '').trim();
  const category = String(data.get('category') || 'burgers');
  const tag = String(data.get('tag') || '');
  const id = editingId || slugifyId(name, category);

  btn.disabled = true;
  status.textContent = selectedFile ? 'Upload image...' : 'Enregistrement...';

  try {
    let imageUrl = null;
    if (editingId) {
      const current = productsCache.find(p => p.id === editingId);
      imageUrl = current?.image_url || null;
    }
    if (selectedFile) {
      imageUrl = await EsamiApi.adminUploadProductImage(selectedFile, id);
    }

    const payload = {
      id,
      category,
      name,
      description: String(data.get('description') || '').trim(),
      price: Number(data.get('price') || 0),
      stock: Number(data.get('stock') || 0),
      weight: String(data.get('weight') || '').trim(),
      brand: String(data.get('brand') || 'Esamaï').trim() || 'Esamaï',
      tags: tag ? [tag] : [],
      image_url: imageUrl,
      active: data.get('active') === 'on',
      sort_order: editingId
        ? (productsCache.find(p => p.id === editingId)?.sort_order || 0)
        : (productsCache.length + 1) * 10
    };

    let saved;
    if (editingId) {
      const { id: _ignore, ...patch } = payload;
      saved = await EsamiApi.adminUpdateProduct(editingId, patch);
      const idx = productsCache.findIndex(p => p.id === editingId);
      if (idx >= 0) productsCache[idx] = saved;
    } else {
      saved = await EsamiApi.adminCreateProduct(payload);
      productsCache.push(saved);
    }

    productsCache.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    fillCategoryFilter();
    renderProducts();
    closeModal();
    toast(editingId ? 'Produit modifié' : 'Produit ajouté');
  } catch (err) {
    status.textContent = err.message || 'Erreur enregistrement';
    toast(status.textContent, 'err');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('refreshProducts').addEventListener('click', loadProducts);
document.getElementById('refreshOrders').addEventListener('click', loadOrders);
document.getElementById('productSearch').addEventListener('input', renderProducts);
document.getElementById('productCatFilter').addEventListener('change', renderProducts);
document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);

document.getElementById('copyStorageSql')?.addEventListener('click', async () => {
  const sql = `-- Créer le bucket product-images + droits
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

drop policy if exists "Auth upload product images" on storage.objects;
create policy "Auth upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Auth update product images" on storage.objects;
create policy "Auth update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "Auth delete product images" on storage.objects;
create policy "Auth delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');`;
  try {
    await navigator.clipboard.writeText(sql);
    toast('SQL copié — colle-le dans Supabase → SQL Editor → Run');
  } catch {
    toast('Impossible de copier automatiquement', 'err');
  }
});

boot();