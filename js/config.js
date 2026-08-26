/* Config Supabase Esamaï
   Récupère les clés : Supabase → Project Settings → API */
window.ESAMAI_CONFIG = {
  // Project URL
  supabaseUrl: 'https://etnssupdveppbfdrtmsp.supabase.co',

  // Prefer the classic "anon" / "public" key (starts with eyJ...)
  // If you only see a publishable key, paste it here for now.
  supabaseAnonKey: 'sb_publishable_v44C0dJTad0oXCKzrhQBQw_HnGZBJZK',

  whatsappNumber: '221786882655',
  adminEmailHint: 'diagnemohameth139@gmail.com'
};

window.ESAMAI_CONFIG.isConfigured = function () {
  const url = this.supabaseUrl || '';
  const key = this.supabaseAnonKey || '';
  return url.includes('supabase.co') &&
    !url.includes('YOUR_PROJECT_REF') &&
    key.length > 20 &&
    !key.includes('YOUR_SUPABASE_ANON_KEY');
};
