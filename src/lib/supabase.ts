import { createClient } from '@supabase/supabase-js';

// These are public client credentials. Database access is protected by RLS.
// You can override them with Vite environment variables for local development.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ixpffnxjdprijkfifkfo.supabase.co';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_EFBYENfKLJ65CU17iuTCYA_NuD9mw-J';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
