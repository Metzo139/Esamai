// Initialisation du client Supabase
// (Assurez-vous que les variables SUPABASE_URL et SUPABASE_ANON_KEY sont bien définies)
const SUPABASE_URL = window.ESAMAI_CONFIG?.supabaseUrl || 'https://etnssupdveppbfdrtmsp.supabase.co';
const SUPABASE_KEY = window.ESAMAI_CONFIG?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bnNzdXBkdmVwcGJmZHJ0bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDQ0MTQsImV4cCI6MjEwMzMyMDQxNH0.f9DzbkDEyguQof-gR8WN3w9Tl_M-0S9oftpgxLVMViE';

const _supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);const supabaseUrl = window.ESAMAI_CONFIG?.supabaseUrl;
const supabaseKey = window.ESAMAI_CONFIG?.supabaseKey;

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

window.EsamiApi = {
  isReady() {
    return !!_supabase;
  },

  // --- AUTHENTIFICATION ---
  async adminSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
  },

  async adminSignIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async adminSignOut() {
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
  },

  // --- PRODUITS ---
  async adminFetchProducts() {
    const { data, error } = await _supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async adminCreateProduct(payload) {
    const { data, error } = await _supabase
      .from('products')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async adminUpdateProduct(id, patch) {
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
    const { error } = await _supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- UPLOAD IMAGE ---
  async adminUploadProductImage(file, productId) {
    const ext = file.name.split('.').pop();
    const filePath = `${productId}-${Date.now()}.${ext}`;

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
    const { data, error } = await _supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async adminUpdateOrderStatus(id, status) {
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