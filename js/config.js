// Online config (public values only: the Supabase project URL and its anon / publishable key).
// The GitHub Actions build uses repository secrets SUPABASE_URL / SUPABASE_ANON_KEY when they are set,
// otherwise the values below. Empty values = offline mode with simulated rivals.
window.GR_CONFIG = { supabaseUrl: '', supabaseKey: '', build: 'dev' };
