import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ============ TYPES ============
export interface User {
  id: string;
  email: string;
  // Пароли больше не хранятся на клиенте: проверку «email + пароль» выполняет
  // встроенная система Supabase Auth (см. src/lib/supabase.ts).
  name: string;
  avatar: string;
  role: 'creator' | 'admin' | 'employee';
  department: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  plan: number;
  fact: number;
  salesCoins: number;
  profileColor: string;
  achievements: UserAchievement[];
  monthlyHistory: MonthlyRecord[];
  createdAt: string;
  purchasedPrizes: PurchasedPrize[];
}

export interface PurchasedPrize {
  id: string;
  prizeId: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  category: string;
  purchasedAt: string;
}

export interface UserAchievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  date: string;
  cost: number; // стоимость в монетах
  image?: string; // URL картинки достижения
}

export interface AchievementTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cost: number; // стоимость в монетах
  image?: string; // URL картинки достижения
  isActive: boolean; // активно ли достижение в системе
  createdAt: string;
}

export interface MonthlyRecord {
  month: string;
  plan: number;
  fact: number;
  percentage: number;
}

export interface Prize {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  available: boolean;
  category: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  total: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'seasonal';
  assignedTo: string[]; // ID пользователей, которым назначен челлендж (обязательно)
  progressByUser: Record<string, { progress: number; completed: boolean; rewardClaimed: boolean }>; // Прогресс каждого пользователя
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  emoji: string;
  time: string;
  read: boolean;
}

export interface DepartmentPlan {
  total: number;
  current: number;
  percentage: number;
  lastMonth: number;
  brandOfMonth: string;
  promoOfMonth: string;
  importantAnnouncements: string;
  month: string; // текущий месяц (например, "Июнь 2024")
  year: number;
}

export interface MonthlyPlanArchive {
  id: string;
  name?: string;
  month: string;
  year: number;
  totalPlan: number;
  totalFact: number;
  percentage: number;
  employeePlans: { userId: string; name: string; plan: number; fact: number; percentage: number }[];
  archivedAt: string;
}

export interface CompanySettings {
  name: string;
  mainColor: string;
  soundsEnabled: boolean;
  pushEnabled: boolean;
  confettiEnabled: boolean;
  crmConnected: boolean;
  apiKey: string;
}

// ============ CONSTANTS ============
export const CREATOR_EMAIL = 'ignis.kwork@gmal.com';
// Пароль создателя проверяется Supabase Auth: аккаунт создаётся в Supabase
// автоматически при первом входе с этим email и паролем (bootstrap-регистрация).
export const CREATOR_PASSWORD = 'admin123';

const AVATARS = ['👩‍💼', '👩‍🦰', '👩‍🦱', '💁‍♀️', '🧕', '👱‍♀️', '👩', '🧑‍💼', '👩‍🔬', '🧝‍♀️', '🦸‍♀️', '🧙‍♀️'];

const DEFAULT_ACHIEVEMENTS: UserAchievement[] = [];

const DEFAULT_MONTHLY_HISTORY: MonthlyRecord[] = [
  { month: 'Янв', plan: 400000, fact: 380000, percentage: 95 },
  { month: 'Фев', plan: 450000, fact: 460000, percentage: 102 },
  { month: 'Мар', plan: 450000, fact: 430000, percentage: 96 },
  { month: 'Апр', plan: 500000, fact: 520000, percentage: 104 },
  { month: 'Май', plan: 500000, fact: 480000, percentage: 96 },
  { month: 'Июн', plan: 500000, fact: 0, percentage: 0 },
];

// ============ HELPERS ============
function generateId(): string {
  // Криптографически стойный ID: исключает коллизии Date.now()+Math.random(),
  // из-за которых у пользователей, зарегистрированных почти одновременно,
  // мог «слипнуться» аккаунт и данные терялись.
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ============ SUPABASE AUTH HELPERS ============
// Профиль пользователя (роль, аватар, XP и т.д.) хранится в user_metadata
// учётной записи Supabase Auth — то есть на сервере в Supabase, а не в
// localStorage браузера. Список всех участников команды загружается через
// RPC get_team_profiles (SQL-функция SECURITY DEFINER, обращается к auth.users).
// Если функция в проекте ещё не создана — приложение автоматически применяет
// миграцию ниже (для этого в проекте должен быть включён anon key validation
// для publishable-ключей).
const TEAM_PROFILES_RPC = 'get_team_profiles';

const TEAM_PROFILES_MIGRATION_SQL = `
create or replace function public.get_team_profiles()
returns table (
  id uuid,
  email text,
  name text,
  avatar text,
  role text,
  department text,
  level int,
  xp int,
  "xpToNext" int,
  streak int,
  plan numeric,
  fact numeric,
  "salesCoins" numeric,
  "profileColor" text,
  achievements jsonb,
  "monthlyHistory" jsonb,
  "purchasedPrizes" jsonb,
  "createdAt" timestamptz
)
language sql security definer stable set search_path = public as $$
  select
    u.id,
    lower(u.email::text) as email,
    coalesce(u.raw_user_meta_data ->> 'name', 'Сотрудник'),
    coalesce(u.raw_user_meta_data ->> 'avatar', '🙂'),
    coalesce(u.raw_user_meta_data ->> 'role', 'employee'),
    coalesce(u.raw_user_meta_data ->> 'department', 'Отдел продаж'),
    coalesce((u.raw_user_meta_data ->> 'level')::int, 1),
    coalesce((u.raw_user_meta_data ->> 'xp')::int, 0),
    coalesce((u.raw_user_meta_data ->> 'xpToNext')::int, 1000),
    coalesce((u.raw_user_meta_data ->> 'streak')::int, 0),
    coalesce((u.raw_user_meta_data ->> 'plan')::numeric, 0),
    coalesce((u.raw_user_meta_data ->> 'fact')::numeric, 0),
    coalesce((u.raw_user_meta_data ->> 'salesCoins')::numeric, 0),
    coalesce(u.raw_user_meta_data ->> 'profileColor', 'pink'),
    coalesce(u.raw_user_meta_data -> 'achievements', '[]'::jsonb),
    coalesce(u.raw_user_meta_data -> 'monthlyHistory', '[]'::jsonb),
    coalesce(u.raw_user_meta_data -> 'purchasedPrizes', '[]'::jsonb),
    u.created_at
  from auth.users u
  where u.raw_user_meta_data ? 'sqApp'
$$;

revoke all on function public.get_team_profiles() from public;
grant execute on function public.get_team_profiles() to anon, authenticated;
`;

// Снимок профиля для записи в user_metadata (без паролей — их не существует
// на клиенте; без служебного флага sqApp).
function profileMetadata(user: User): Record<string, unknown> {
  const { id: _id, email: _email, ...rest } = user as unknown as Record<string, unknown>;
  return { ...rest, sqApp: true };
}

function mapProfileRow(row: Record<string, any>): User {
  const parseArr = (v: unknown): any[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  return {
    id: String(row.id),
    email: String(row.email ?? '').trim().toLowerCase(),
    name: row.name || 'Сотрудник',
    avatar: row.avatar || '🙂',
    role: (['creator', 'admin', 'employee'].includes(row.role) ? row.role : 'employee') as User['role'],
    department: row.department || 'Отдел продаж',
    level: Number(row.level ?? 1) || 1,
    xp: Number(row.xp ?? 0) || 0,
    xpToNext: Number(row.xpToNext ?? 1000) || 1000,
    streak: Number(row.streak ?? 0) || 0,
    plan: Number(row.plan ?? 0) || 0,
    fact: Number(row.fact ?? 0) || 0,
    salesCoins: Number(row.salesCoins ?? 0) || 0,
    profileColor: row.profileColor || 'pink',
    achievements: parseArr(row.achievements),
    monthlyHistory: parseArr(row.monthlyHistory),
    purchasedPrizes: parseArr(row.purchasedPrizes),
    createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
  };
}

// Аккуратно извлекаем текст ошибки Supabase и переводим типовые случаи на русский.
function supabaseAuthError(err: { message?: string } | null, fallback: string): string {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Неверный email или пароль';
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) return 'Email не подтверждён. Проверьте почту.';
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already registered')) return 'Email уже зарегистрирован';
  if (msg.includes('password should be at least')) return 'Пароль должен быть минимум 6 символов';
  if (msg.includes('unable to validate email address')) return 'Некорректный email';
  if (msg.includes('rate limit') || msg.includes('too many requests')) return 'Слишком много попыток. Повторите позже.';
  return err?.message ? `${fallback}: ${err.message}` : fallback;
}

// ============ DEFAULT DATA ============
function getDefaultPrizes(): Prize[] {
  return [
    { id: '1', name: 'Сертификат Ozon', emoji: '🛍️', description: 'Сертификат на 3000₽', cost: 500, available: true, category: 'Сертификаты' },
    { id: '2', name: 'Дополнительный выходной', emoji: '🏖️', description: 'Лишний день отдыха', cost: 1200, available: true, category: 'Отдых' },
    { id: '3', name: 'Кофе на месяц', emoji: '☕', description: 'Кофе в любимой кофейне', cost: 300, available: true, category: 'Напитки' },
    { id: '4', name: 'SPA-день', emoji: '💆‍♀️', description: 'Полный день в SPA-салоне', cost: 800, available: true, category: 'Отдых' },
    { id: '5', name: 'Сертификат Wildberries', emoji: '🎁', description: 'Сертификат на 5000₽', cost: 800, available: true, category: 'Сертификаты' },
    { id: '6', name: 'Билеты в кино', emoji: '🎬', description: '2 билета + попкорн', cost: 200, available: true, category: 'Развлечения' },
    { id: '7', name: 'Ужин в ресторане', emoji: '🍽️', description: 'Сертификат на 5000₽', cost: 700, available: true, category: 'Развлечения' },
    { id: '8', name: 'Набор косметики', emoji: '💄', description: 'Подарочный набор от бренда', cost: 600, available: true, category: 'Красота' },
    { id: '9', name: 'Брендированный мерч', emoji: '👕', description: 'Эксклюзивная коллекция', cost: 400, available: true, category: 'Мерч' },
    { id: '10', name: 'Золотой браслет', emoji: '💫', description: 'Эксклюзивный аксессуар', cost: 2000, available: true, category: 'Премиум' },
  ];
}

function getDefaultDepartmentPlan(): DepartmentPlan {
  const now = new Date();
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return {
    total: 3000000,
    current: 0,
    percentage: 0,
    lastMonth: 82.3,
    brandOfMonth: 'Samsung',
    promoOfMonth: 'Летняя распродажа',
    importantAnnouncements: '',
    month: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
    year: now.getFullYear(),
  };
}

function getDefaultSettings(): CompanySettings {
  return {
    name: 'EastAsia',
    mainColor: 'pink',
    soundsEnabled: true,
    pushEnabled: true,
    confettiEnabled: true,
    crmConnected: false,
    apiKey: '',
  };
}

// ============ CONTEXT ============
interface AppState {
  // Auth (Supabase Auth: email + пароль, данные хранятся в Supabase)
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;

  // User data
  updateCurrentUser: (data: Partial<User>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
  promoteToAdmin: (id: string) => void;
  demoteFromAdmin: (id: string) => void;

  // Global data (admin only)
  prizes: Prize[];
  challenges: Challenge[];
  notifications: Notification[];
  departmentPlan: DepartmentPlan;
  companySettings: CompanySettings;
  planArchives: MonthlyPlanArchive[];

  updatePrizes: (prizes: Prize[]) => void;
  addPrize: (prize: Prize) => void;
  updatePrize: (id: string, data: Partial<Prize>) => void;
  removePrize: (id: string) => void;

  updateChallenges: (challenges: Challenge[]) => void;
  updateChallenge: (id: string, data: Partial<Challenge>) => void;
  addChallenge: (challenge: Challenge) => void;
  removeChallenge: (id: string) => void;
  assignChallenge: (challengeId: string, userIds: string[]) => void;
  updateChallengeProgress: (challengeId: string, userId: string, progressDelta: number) => void;
  claimChallengeReward: (challengeId: string, userId: string) => void;

  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updateDepartmentPlan: (data: Partial<DepartmentPlan>) => void;
  updateCompanySettings: (data: Partial<CompanySettings>) => void;
  
  archiveCurrentMonthPlan: () => void;
  updatePlanArchive: (id: string, data: Partial<MonthlyPlanArchive>) => void;
  removePlanArchive: (id: string) => void;

  spendCoins: (amount: number, prize?: Prize) => void;

  // Achievements management (admin only)
  achievementTemplates: AchievementTemplate[];
  addAchievementTemplate: (template: AchievementTemplate) => void;
  updateAchievementTemplate: (id: string, data: Partial<AchievementTemplate>) => void;
  removeAchievementTemplate: (id: string) => void;
  grantAchievementToUser: (userId: string, achievementId: string) => UserAchievement | null;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Профиль создателя: id — UUID учётной записи в Supabase Auth
  // (детерминированный из email), аккаунт создаётся в Supabase автоматически
  // при первом входе с CREATOR_EMAIL / CREATOR_PASSWORD.
  const makeCreator = (): User => ({
    id: '10000000-0000-4000-8000-000000000001',
    email: CREATOR_EMAIL,
    name: 'Создатель',
    avatar: '👑',
    role: 'creator',
    department: 'Управление',
    level: 1,
    xp: 0,
    xpToNext: 1000,
    streak: 0,
    plan: 0,
    fact: 0,
    salesCoins: 0,
    profileColor: 'pink',
    achievements: [],
    monthlyHistory: [],
    purchasedPrizes: [],
    createdAt: new Date().toISOString(),
  });

  const [users, setUsersState] = useState<User[]>([]);
  const usersRef = useRef<User[]>([]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Кэш профилей команды из Supabase (кратковременный — только для гашения
  // шквала перезаписей user_metadata при пакетных операциях).
  const teamCacheRef = useRef<{ time: number; data: User[] } | null>(null);
  const writeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const bootstrapDoneRef = useRef(false);

  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('sb-izhycodgxrnophnmemwo-auth-token');
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const setUsers = useCallback((updater: User[] | ((prev: User[]) => User[])) => {
    setUsersState(prev => (typeof updater === 'function'
      ? (updater as (prev: User[]) => User[])(prev)
      : updater));
  }, []);

  // ============ ЗАГРУЗКА КОМАНДЫ ИЗ SUPABASE ============
  const fetchTeamFromSupabase = useCallback(async (): Promise<User[]> => {
    const cache = teamCacheRef.current;
    if (cache && Date.now() - cache.time < 3000) return cache.data;

    let { data, error } = await supabase.rpc(TEAM_PROFILES_RPC);
    if (error) {
      // RPC ещё нет в проекте — пробуем создать функцию через SQL-миграцию
      // (работает, если в проекте включена проверка anon key для publishable-ключей).
      const enc = encodeURIComponent(btoa(unescape(encodeURIComponent(TEAM_PROFILES_MIGRATION_SQL))));
      const res = await fetch(`${SUPABASE_URL}/pg/query?query=${enc}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && !json.error) {
          teamCacheRef.current = null;
          ({ data, error } = await supabase.rpc(TEAM_PROFILES_RPC));
        }
      }
    }
    if (error) {
      console.error('Не удалось загрузить список пользователей из Supabase:', error.message);
      throw error;
    }
    const list: User[] = (Array.isArray(data) ? data : []).map(mapProfileRow);
    teamCacheRef.current = { time: Date.now(), data: list };
    return list;
  }, []);

  const refreshTeam = useCallback(async () => {
    try {
      const list = await fetchTeamFromSupabase();
      setUsersState(list);
    } catch {
      // ошибка уже залогирована; оставляем текущий снимок
    }
  }, [fetchTeamFromSupabase]);

  // ============ СОХРАНЕНИЕ ПРОФИЛЯ В SUPABASE ============
  // Профиль пишется в user_metadata учётной записи через supabase.auth.updateUser
  // (изменения применяются к авторизованному пользователю на сервере Supabase).
  const persistProfile = useCallback(async (user: User) => {
    const isSelf = currentUserRef.current?.id === user.id;
    if (!isSelf) {
      console.warn(`Профиль «${user.name}» изменён локально: записать его можно только от имени самого пользователя.`);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(user) });
      if (error) console.error('Не удалось сохранить профиль в Supabase:', error.message);
    } catch (e) {
      console.error('Не удалось сохранить профиль в Supabase:', e);
    }
  }, []);

  // Пакетная запись: частые изменения одного и того же профиля (например,
  // прогресс челленджей) сливаются в один запрос к Supabase.
  const schedulePersist = useCallback((user: User) => {
    const timers = writeTimersRef.current;
    const existing = timers.get(user.id);
    if (existing) clearTimeout(existing);
    timers.set(user.id, setTimeout(() => {
      timers.delete(user.id);
      void persistProfile(user);
    }, 600));
  }, [persistProfile]);

  // Bootstrap-регистрация создателя в Supabase Auth при первом входе.
  const ensureCreatorAccount = useCallback(async (password: string): Promise<void> => {
    if (bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: CREATOR_EMAIL,
        password,
        options: { data: profileMetadata(makeCreator()) },
      });
      if (!error && data.session) {
        // Аккаунт был создан прямо сейчас — завершаем вспомогательную сессию,
        // чтобы не «перехватывать» вход текущего пользователя.
        await supabase.auth.signOut();
      }
    } catch {
      bootstrapDoneRef.current = false;
    }
  }, []);

  // ============ СЕССИЯ SUPABASE ============
  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setCurrentUser(null);
      return;
    }
    const uid = session.user.id;
    const umail = String(session.user.email ?? '').trim().toLowerCase();
    const buildFallback = (): User => {
      const meta = (session.user!.user_metadata ?? {}) as Record<string, any>;
      const base = uid === makeCreator().id || umail === CREATOR_EMAIL ? makeCreator() : null;
      const known = usersRef.current.find(u => u.id === uid || u.email === umail);
      return {
        ...(base ?? known ?? {
          id: uid,
          email: umail,
          name: 'Сотрудник',
          avatar: getRandomAvatar(),
          role: 'employee' as const,
          department: 'Отдел продаж',
          level: 1, xp: 0, xpToNext: 1000, streak: 1,
          plan: 500000, fact: 0, salesCoins: 100,
          profileColor: 'pink',
          achievements: [], monthlyHistory: [], purchasedPrizes: [],
          createdAt: new Date().toISOString(),
        }),
        id: uid,
        email: umail,
        name: meta.name || (base ?? known)?.name || 'Сотрудник',
      } as User;
    };
    try {
      const list = await fetchTeamFromSupabase();
      setUsersState(list);
      const fresh = list.find(u => u.id === uid) || list.find(u => u.email === umail);
      setCurrentUser(fresh ? { ...fresh, id: uid, email: umail } : buildFallback());
    } catch {
      setCurrentUser(buildFallback());
    }
  }, [fetchTeamFromSupabase]);

  // Восстановление сессии + подписка на изменения авторизации Supabase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) await applySession(data.session);
      } catch {
        /* сетевая ошибка — остаёмся на экране входа */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateEvent(async ({ event, session }) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await applySession(session);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  // Периодически подтягиваем команду из Supabase — изменения других
  // пользователей/устройств видны без перезагрузки.
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      teamCacheRef.current = null;
      void refreshTeam();
    }, 20000);
    return () => clearInterval(interval);
  }, [currentUser, refreshTeam]);

  const [prizes, setPrizes] = useState<Prize[]>(() => loadFromStorage('sq_prizes', getDefaultPrizes()));
  const [challenges, setChallenges] = useState<Challenge[]>(() => loadFromStorage('sq_challenges', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('sq_notifications', []));
  const [departmentPlan, setDepartmentPlan] = useState<DepartmentPlan>(() => loadFromStorage('sq_dept_plan', getDefaultDepartmentPlan()));
  const [planArchives, setPlanArchives] = useState<MonthlyPlanArchive[]>(() => loadFromStorage('sq_plan_archives', []));
  const [achievementTemplates, setAchievementTemplates] = useState<AchievementTemplate[]>(() => loadFromStorage('sq_achievements', []));
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const settings = loadFromStorage('sq_settings', getDefaultSettings());
    // Миграция: если старое название, обновить
    if (settings.name === 'SalesQuest') {
      settings.name = 'EastAsia';
    }
    return settings;
  });

  // Данные пользователей (аккаунты и профили) хранятся в Supabase Auth,
  // поэтому из localStorage удаляем легаси-записи прошлых версий — пароли
  // и профили больше не должны оставаться в браузере.
  useEffect(() => {
    try {
      localStorage.removeItem('sq_users');
      localStorage.removeItem('sq_current_user');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => { saveToStorage('sq_prizes', prizes); }, [prizes]);
  useEffect(() => { saveToStorage('sq_challenges', challenges); }, [challenges]);
  useEffect(() => { saveToStorage('sq_notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('sq_dept_plan', departmentPlan); }, [departmentPlan]);
  useEffect(() => { saveToStorage('sq_plan_archives', planArchives); }, [planArchives]);
  useEffect(() => { saveToStorage('sq_achievements', achievementTemplates); }, [achievementTemplates]);
  useEffect(() => { saveToStorage('sq_settings', companySettings); }, [companySettings]);

  // Recalculate department plan when users change
  useEffect(() => {
    const employees = users.filter(u => u.role === 'employee');
    if (employees.length > 0) {
      const totalPlan = employees.reduce((s, u) => s + u.plan, 0);
      const totalFact = employees.reduce((s, u) => s + u.fact, 0);
      const percentage = totalPlan > 0 ? Math.round((totalFact / totalPlan) * 1000) / 10 : 0;
      setDepartmentPlan(prev => ({
        ...prev,
        total: totalPlan || prev.total,
        current: totalFact,
        percentage,
      }));
    }
  }, [users]);

  const isAdmin = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'creator' || currentUser.role === 'admin';
  }, [currentUser]);

  // ============ AUTH: SUPABASE (email + пароль) ============
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Нормализуем ввод: мобильные клавиатуры и автозаполнение часто добавляют
    // пробелы/регистр — из-за этого «правильный» email не находился.
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { success: false, error: 'Введите email и пароль' };
    }

    // Первый вход создателя: аккаунта ещё нет в Supabase — регистрируем его
    // автоматически (пароль проверяется уже Supabase Auth на сервере).
    if (normalizedEmail === CREATOR_EMAIL && password === CREATOR_PASSWORD) {
      await ensureCreatorAccount(CREATOR_PASSWORD);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      return { success: false, error: supabaseAuthError(error, 'Ошибка входа') };
    }
    await applySession(data.session);
    return { success: true };
  }, [applySession, ensureCreatorAccount]);

  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      return { success: false, error: 'Введите имя' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Пароль должен быть минимум 6 символов' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'Некорректный email' };
    }

    let role: 'creator' | 'admin' | 'employee' = 'employee';
    if (normalizedEmail === CREATOR_EMAIL) role = 'creator';

    const profile: User = {
      id: '', // будет заменён UUID учётной записи из Supabase
      email: normalizedEmail,
      name: name.trim(),
      avatar: getRandomAvatar(),
      role,
      department: 'Отдел продаж',
      level: 1,
      xp: 0,
      xpToNext: 1000,
      streak: 1,
      plan: 500000,
      fact: 0,
      salesCoins: 100,
      profileColor: 'pink',
      achievements: [...DEFAULT_ACHIEVEMENTS],
      monthlyHistory: DEFAULT_MONTHLY_HISTORY.map(r => ({ ...r, fact: 0, percentage: 0 })),
      purchasedPrizes: [],
      createdAt: new Date().toISOString(),
    };

    // Регистрация выполняется встроенной системой Supabase Auth — учётная
    // запись (email + хеш пароля) создаётся на сервере Supabase, профиль —
    // в user_metadata этой же учётной записи.
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: profileMetadata(profile) },
    });
    if (error) {
      return { success: false, error: supabaseAuthError(error, 'Ошибка регистрации') };
    }

    if (data.session) {
      await applySession(data.session);
    } else if (data.user) {
      // В проекте включено подтверждение email: сессии нет — вход по логину/паролю.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) {
        return {
          success: false,
          error: 'Аккаунт создан. Подтвердите email, затем войдите по паролю.',
        };
      }
      const { data: sd } = await supabase.auth.getSession();
      await applySession(sd.session);
    } else {
      return { success: false, error: 'Не удалось создать аккаунт в Supabase' };
    }

    teamCacheRef.current = null;
    void refreshTeam();

    // Add welcome notification
    const welcomeNotif: Notification = {
      id: generateId(),
      userId: data.user?.id ?? currentUserRef.current?.id ?? '',
      title: 'Добро пожаловать!',
      message: `Рады видеть вас в ${companySettings.name}! 🎉`,
      emoji: '👋',
      time: 'Только что',
      read: false,
    };
    setNotifications(prev => [welcomeNotif, ...prev]);

    return { success: true };
  }, [applySession, companySettings.name, refreshTeam]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    void supabase.auth.signOut();
  }, []);

  const updateCurrentUser = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    schedulePersist(updated);
  }, [currentUser, schedulePersist]);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    const target = usersRef.current.find(u => u.id === id);
    if (!target) return;
    const merged = { ...target, ...data };
    setUsers(prev => prev.map(u => u.id === id ? merged : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : prev);
    }
    schedulePersist(merged);
  }, [currentUser, schedulePersist]);

  const removeUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  // Смена роли должна обновлять и currentUser (он хранится отдельно от users),
  // иначе назначенный админ не получает права до перезахода, а у создателя
  // пропадает доступ к «Управлению командой» после смены роли.
  const changeUserRole = useCallback((id: string, role: 'admin' | 'employee') => {
    let changedSelf = false;
    setUsers(prev => prev.map(u => {
      if (u.id !== id || u.role === 'creator') return u;
      const updated = { ...u, role };
      if (currentUserRef.current?.id === id) {
        changedSelf = true;
        schedulePersist(updated); // роль текущего пользователя — сразу в Supabase
      }
      return updated;
    }));
    if (changedSelf) {
      setCurrentUser(prev => (prev && prev.id === id && prev.role !== 'creator' ? { ...prev, role } : prev));
    }
  }, [schedulePersist]);

  const promoteToAdmin = useCallback((id: string) => {
    changeUserRole(id, 'admin');
  }, [changeUserRole]);

  const demoteFromAdmin = useCallback((id: string) => {
    changeUserRole(id, 'employee');
  }, [changeUserRole]);

  const updateDepartmentPlan = useCallback((data: Partial<DepartmentPlan>) => {
    setDepartmentPlan(prev => {
      const updated = { ...prev, ...data };
      if (data.total !== undefined || data.current !== undefined) {
        const total = data.total ?? prev.total;
        const current = data.current ?? prev.current;
        updated.percentage = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;
      }
      return updated;
    });
  }, []);

  const updateCompanySettings = useCallback((data: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...data }));
  }, []);

  const spendCoins = useCallback((amount: number, prize?: Prize) => {
    if (!currentUser) return;
    const newCoins = Math.max(0, currentUser.salesCoins - amount);
    let updateData: Partial<User> = { salesCoins: newCoins };
    
    // Если передан приз, добавляем его в купленные
    if (prize) {
      const purchasedPrize: PurchasedPrize = {
        id: generateId(),
        prizeId: prize.id,
        name: prize.name,
        emoji: prize.emoji,
        description: prize.description,
        cost: prize.cost,
        category: prize.category,
        purchasedAt: new Date().toISOString(),
      };
      updateData.purchasedPrizes = [...(currentUser.purchasedPrizes || []), purchasedPrize];
    }
    
    updateCurrentUser(updateData);
  }, [currentUser, updateCurrentUser]);

  const addNotification = useCallback((notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  }, [currentUser]);

  const addChallenge = useCallback((challenge: Challenge) => {
    setChallenges(prev => [...prev, challenge]);
  }, []);

  const removeChallenge = useCallback((id: string) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
  }, []);

  // Обновление прогресса пользователя в челлендже (прогресс строго персональный)
  const updateChallengeProgress = useCallback((challengeId: string, userId: string, progressDelta: number) => {
    if (!userId) return;
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      
      const userProgress = c.progressByUser?.[userId] || { progress: 0, completed: false, rewardClaimed: false };
      if (userProgress.completed) return c; // выполненный челлендж больше не меняется
      const newProgress = Math.max(0, Math.min(userProgress.progress + progressDelta, c.total));
      const isCompleted = newProgress >= c.total;
      
      return {
        ...c,
        progressByUser: {
          ...(c.progressByUser ?? {}),
          [userId]: {
            progress: newProgress,
            completed: isCompleted,
            rewardClaimed: userProgress.rewardClaimed, // сохраняем статус получения награды
          }
        }
      };
    }));
  }, []);

  // Получение награды пользователем за выполнение челленджа (только его собственная награда)
  const claimChallengeReward = useCallback((challengeId: string, userId: string) => {
    if (!userId) return;
    // Сначала находим челлендж и проверяем, можно ли получить награду
    const challenge = challenges.find(c => c.id === challengeId);
    const userProgress = challenge?.progressByUser?.[userId];
    if (!challenge || !userProgress || !userProgress.completed || userProgress.rewardClaimed) return;

    // Начисляем награду только этому пользователю
    setUsers(usersPrev => usersPrev.map(u => {
      if (u.id !== userId) return u;
      const updated = { ...u, salesCoins: u.salesCoins + challenge.xpReward };
      schedulePersist(updated); // награда сохраняется в профиль Supabase
      return updated;
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, salesCoins: prev.salesCoins + challenge.xpReward } : prev);
    }
    
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      return {
        ...c,
        progressByUser: {
          ...c.progressByUser,
          [userId]: {
            ...c.progressByUser[userId],
            rewardClaimed: true
          }
        }
      };
    }));
  }, [challenges, currentUser]);

  const assignChallenge = useCallback((challengeId: string, userIds: string[]) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, assignedTo: userIds } : c
    ));
  }, []);

  const archiveCurrentMonthPlan = useCallback(() => {
    const now = new Date();
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if already archived for this month
    const alreadyArchived = planArchives.some(
      a => a.month === monthNames[currentMonthIndex] && a.year === currentYear
    );
    if (alreadyArchived) {
      return; // Already archived
    }

    const employees = users.filter(u => u.role === 'employee');
    const totalPlan = employees.reduce((s, u) => s + u.plan, 0);
    const totalFact = employees.reduce((s, u) => s + u.fact, 0);
    const percentage = totalPlan > 0 ? Math.round((totalFact / totalPlan) * 1000) / 10 : 0;

    const employeePlans = employees.map(u => ({
      userId: u.id,
      name: u.name,
      plan: u.plan,
      fact: u.fact,
      percentage: u.plan > 0 ? Math.round((u.fact / u.plan) * 1000) / 10 : 0,
    }));

    const archive: MonthlyPlanArchive = {
      id: generateId(),
      month: monthNames[currentMonthIndex],
      year: currentYear,
      totalPlan,
      totalFact,
      percentage,
      employeePlans,
      archivedAt: new Date().toISOString(),
    };

    setPlanArchives(prev => [...prev, archive]);

    // Reset current month plan for next month
    employees.forEach(emp => {
      setUsers(prev => prev.map(u => 
        u.id === emp.id ? { ...u, plan: 0, fact: 0 } : u
      ));
    });

    setDepartmentPlan(prev => ({
      ...prev,
      total: 0,
      current: 0,
      percentage: 0,
      lastMonth: percentage,
    }));
  }, [planArchives, users]);

  const updatePlanArchive = useCallback((id: string, data: Partial<MonthlyPlanArchive>) => {
    setPlanArchives(prev => prev.map(archive => 
      archive.id === id ? { ...archive, ...data } : archive
    ));
  }, []);

  const removePlanArchive = useCallback((id: string) => {
    setPlanArchives(prev => prev.filter(archive => archive.id !== id));
  }, []);

  const grantAchievementToUser = useCallback((userId: string, achievementId: string): UserAchievement | null => {
    const template = achievementTemplates.find(a => a.id === achievementId);
    if (!template) return null;

    let grantedAchievement: UserAchievement | null = null;

    // Find user and add achievement
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        // Check if user already has this achievement
        const alreadyHas = u.achievements.some(ach => ach.id === achievementId || ach.name === template.name);
        if (alreadyHas) return u;

        const newAchievement: UserAchievement = {
          id: achievementId,
          name: template.name,
          emoji: template.emoji,
          description: template.description,
          rarity: template.rarity,
          date: new Date().toISOString().split('T')[0],
          cost: template.cost,
          image: template.image,
        };

        // Add coins to user's account
        const updatedUser = {
          ...u,
          achievements: [...u.achievements, newAchievement],
          salesCoins: u.salesCoins + template.cost,
        };

        // Also update currentUser if it's the same user
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }

        // Add notification to user about achievement
        const notif: Notification = {
          id: generateId(),
          userId,
          title: 'Новое достижение!',
          message: `Вы получили достижение "${template.name}" (+${template.cost} 🪙)`,
          emoji: template.emoji,
          time: 'Только что',
          read: false,
        };
        setNotifications(prevNotifs => [notif, ...prevNotifs]);

        // Сохраняем выданное достижение, чтобы UI мог показать праздничное окно
        grantedAchievement = newAchievement;

        return updatedUser;
      }
      return u;
    }));

    return grantedAchievement;
  }, [achievementTemplates, currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
      isAdmin,
      updateCurrentUser,
      updateUser,
      removeUser,
      promoteToAdmin,
      demoteFromAdmin,
      prizes,
      challenges,
      notifications,
      departmentPlan,
      companySettings,
      planArchives,
      achievementTemplates,
      updatePrizes: setPrizes,
      addPrize: (prize) => setPrizes(prev => [...prev, prize]),
      updatePrize: (id, data) => setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)),
      removePrize: (id) => setPrizes(prev => prev.filter(p => p.id !== id)),
      updateChallenges: setChallenges,
      updateChallenge: (id, data) => setChallenges(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)),
      addChallenge,
      removeChallenge,
      assignChallenge,
      updateChallengeProgress,
      claimChallengeReward,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      updateDepartmentPlan,
      updateCompanySettings,
      archiveCurrentMonthPlan,
      updatePlanArchive,
      removePlanArchive,
      spendCoins,
      addAchievementTemplate: (template) => setAchievementTemplates(prev => [...prev, template]),
      updateAchievementTemplate: (id, data) => setAchievementTemplates(prev => prev.map(a => a.id === id ? { ...a, ...data } : a)),
      removeAchievementTemplate: (id) => setAchievementTemplates(prev => prev.filter(a => a.id !== id)),
      grantAchievementToUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export { CREATOR_EMAIL, CREATOR_PASSWORD };
