import { createClient } from '@supabase/supabase-js';

// These should be loaded from environment variables in production
// For now, using placeholders that match .env.example
const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
