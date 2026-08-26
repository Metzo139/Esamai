// --- Initialisation unique et sécurisée du client Supabase ---
const SUPABASE_URL = window.ESAMAI_CONFIG?.supabaseUrl || 'https://etnssupdveppbfdrtmsp.supabase.co';
const SUPABASE_KEY = window.ESAMAI_CONFIG?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bnNzdXBkdmVwcGJmZHJ0bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDQ0MTQsImV4cCI6MjEwMzMyMDQxNH0.f9DzbkDEyguQof-gR8WN3w9Tl_M-0S9oftpgxLVMViE';

// Réutilisation de l'instance existante ou création si nécessaire
if (!window.supabaseClient && window.supabase) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const _supabase = window.supabaseClient;

// --- API ESAMAÏ ---
window.EsamiApi = {
  isReady() {
    return !!_supabase;
  },

  // --- AUTHENTIFICATION ---
  async adminSession() {
    if (!_supabase) return null;
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
  },

  async adminSignIn(email, password) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async adminSignOut() {
    if (!_supabase) return;
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
  },

  // --- PRODUITS ---
  async adminFetchProducts() {
    if (!_supabase) return [];
    const { data, error } = await _supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async adminCreateProduct(payload) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await _supabase
      .from('products')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async adminUpdateProduct(id, patch) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await _supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async adminDeleteProduct(id) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const { error } = await _supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- UPLOAD IMAGE ---
  async adminUploadProductImage(file, productId) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const ext = file.name.split('.').pop();
    const filePath = `${productId || 'prod'}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await _supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) throw uploadErr;

    const { data } = _supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // --- COMMANDES ---
  async adminFetchOrders() {
    if (!_supabase) return [];
    const { data, error } = await _supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async adminUpdateOrderStatus(id, status) {
    if (!_supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await _supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};