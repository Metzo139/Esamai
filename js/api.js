// --- Initialisation sécurisée via window ---
window.supabaseClient = window.supabaseClient || (window.supabase ? window.supabase.createClient(
    window.ESAMAI_CONFIG?.supabaseUrl || 'https://etnssupdveppbfdrtmsp.supabase.co',
    window.ESAMAI_CONFIG?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bnNzdXBkdmVwcGJmZHJ0bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDQ0MTQsImV4cCI6MjEwMzMyMDQxNH0.f9DzbkDEyguQof-gR8WN3w9Tl_M-0S9oftpgxLVMViE'
  ) : null);
  
  // --- API ESAMAÏ ---
  window.EsamiApi = {
    isReady() {
      return !!window.supabaseClient;
    },
  
    // --- AUTHENTIFICATION ---
    async adminSession() {
      if (!window.supabaseClient) return null;
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return session;
    },
  
    async adminSignIn(email, password) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
  
    async adminSignOut() {
      if (!window.supabaseClient) return;
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
    },
  
    // --- PRODUITS ---
    async adminFetchProducts() {
      if (!window.supabaseClient) return [];
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  
    async adminCreateProduct(payload) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const { data, error } = await window.supabaseClient
        .from('products')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  
    async adminUpdateProduct(id, patch) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const { data, error } = await window.supabaseClient
        .from('products')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  
    async adminDeleteProduct(id) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const { error } = await window.supabaseClient
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  
    // --- UPLOAD IMAGE ---
    async adminUploadProductImage(file, productId) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const ext = file.name.split('.').pop();
      const filePath = `${productId || 'prod'}-${Date.now()}.${ext}`;
  
      const { error: uploadErr } = await window.supabaseClient.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });
  
      if (uploadErr) throw uploadErr;
  
      const { data } = window.supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);
  
      return data.publicUrl;
    },
  
    // --- COMMANDES ---
    async adminFetchOrders() {
      if (!window.supabaseClient) return [];
      const { data, error } = await window.supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  
    async adminUpdateOrderStatus(id, status) {
      if (!window.supabaseClient) throw new Error("Client Supabase non initialisé");
      const { data, error } = await window.supabaseClient
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  };