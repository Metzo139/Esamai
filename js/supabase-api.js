(function () {
  const cfg = window.ESAMAI_CONFIG || {};
  let client = null;

  function getClient() {
    if (!cfg.isConfigured || !cfg.isConfigured()) return null;
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('Supabase SDK manquant');
      return null;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
  }

  function mapProduct(row) {
    return {
      id: row.id,
      cat: row.category,
      name: row.name,
      price: row.price,
      desc: row.description || '',
      tags: row.tags || [],
      weight: row.weight || '',
      brand: row.brand || 'Esamaï',
      stock: row.stock,
      image: row.image_url || null,
      active: row.active !== false
    };
  }

  async function fetchProducts() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProduct);
  }

  async function placeOrder({ items, customerName, customerPhone, note }) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const payload = items.map((it) => ({ id: it.id, qty: it.qty }));
    const { data, error } = await sb.rpc('place_order', {
      p_items: payload,
      p_customer_name: customerName || null,
      p_customer_phone: customerPhone || null,
      p_note: note || null
    });
    if (error) throw error;
    return data;
  }

  async function adminSignIn(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function adminSignOut() {
    const sb = getClient();
    if (!sb) return;
    await sb.auth.signOut();
  }

  async function adminSession() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  async function adminFetchProducts() {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function adminUpdateProduct(id, patch) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function adminCreateProduct(product) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function adminDeleteProduct(id) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { error } = await sb
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async function adminUploadProductImage(file, productId) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    if (!file) throw new Error('Aucun fichier image');

    const bucket = 'product-images';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${productId || 'tmp'}/${Date.now()}.${ext}`;

    // Vérifie que le bucket existe vraiment
    const { data: buckets, error: listErr } = await sb.storage.listBuckets();
    if (!listErr && Array.isArray(buckets)) {
      const found = buckets.some((b) => b.id === bucket || b.name === bucket);
      if (!found) {
        const names = buckets.map((b) => b.name || b.id).filter(Boolean).join(', ') || '(aucun)';
        throw new Error(
          `Bucket "${bucket}" introuvable. Buckets actuels: ${names}. Crée-le dans Supabase → Storage (Public).`
        );
      }
    }

    const { error: upErr } = await sb.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (upErr) {
      const msg = String(upErr.message || upErr.error || upErr);
      if (/bucket not found/i.test(msg)) {
        throw new Error(
          `Bucket "${bucket}" introuvable. Dans Supabase: Storage → New bucket → nom exact "product-images" → Public → Create.`
        );
      }
      throw upErr;
    }

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function adminFetchOrders() {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  async function adminUpdateOrderStatus(id, status) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase non configuré');
    const { data, error } = await sb
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  window.EsamiApi = {
    getClient,
    isReady: () => !!getClient(),
    fetchProducts,
    placeOrder,
    adminSignIn,
    adminSignOut,
    adminSession,
    adminFetchProducts,
    adminUpdateProduct,
    adminCreateProduct,
    adminDeleteProduct,
    adminUploadProductImage,
    adminFetchOrders,
    adminUpdateOrderStatus
  };
})();
