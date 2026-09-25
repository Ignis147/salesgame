import { createClient } from '@supabase/supabase-js';

// ============ SUPABASE CLIENT ============
// Проект: izhycodgxrnophnmemwo. Публичный (publishable) ключ безопасен для
// браузера: доступ к данным ограничен политиками RLS, а пароли пользователей
// проверяет встроенный Supabase Auth — они никогда не хранятся на клиенте.
export const SUPABASE_URL = 'https://izhycodgxrnophnmemwo.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_LNRK6N81ekkWaPKMNs459w_4gEBwt9B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
