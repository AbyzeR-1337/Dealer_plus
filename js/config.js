// Online config (public values only: the Supabase project URL and its anon / publishable key).
// The GitHub Actions build uses repository secrets SUPABASE_URL / SUPABASE_ANON_KEY when they are set,
// otherwise the values below. Empty values = offline mode with simulated rivals.
window.GR_CONFIG = {
  supabaseUrl: 'https://gyqgkwxbohwmngbspadl.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cWdrd3hib2h3bW5nYnNwYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MjEyMjAsImV4cCI6MjEwOTk5NzIyMH0.g1oPu1acnwOOQeJ2zy0XO2Nc20XAKPMdAGY2WnWjyV8',
  build: 'dev',
};
