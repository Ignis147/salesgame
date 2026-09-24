import { createClient } from '@supabase/supabase-js';

// ============ SUPABASE CLIENT ============
// Проект: izhycodgxrnophnmemwo
// Регистрация и вход выполняются встроенной системой Supabase Auth (email + пароль).
// Сессия (access/refresh token) хранится штатным механизмом supabase-js в
// localStorage под ключом sb-izhycodgxrnophnmemwo-auth-token.
export const SUPABASE_URL = 'https://izhycodgxrnophnmemwo.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_LNRK6N81ekkWaPKMNs459w_4gEBwt9B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
