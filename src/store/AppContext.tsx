import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ============ TYPES ============
export interface User {
  // id пользователя совпадает с uid в Supabase Auth (auth.users.id)
  id: string;
  email: string;
  // Пароли больше не хранятся на клиенте: их проверяет встроенный
  // Supabase Auth (email + пароль). Поле оставлено опциональным только
  // для совместимости типов со старым кодом UI.
  password?: string;
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
export const CREATOR_EMAIL = 'ignis.kwork@gmail.com';
// Пароль создателя больше не хранится в коде: аккаунт ignis.kwork@gmail.com
// регистрируется через Supabase Auth (email + пароль), а роль creator
// назначается автоматически (см. supabase/schema.sql → handle_new_user).

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
  // Криптографически стойный ID для локальных сущностей (уведомления, покупки).
  // ID пользователей теперь выдаёт Supabase Auth (uuid).
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
// Профиль по умолчанию для нового пользователя (заполняется при регистрации).
function defaultProfileForNewUser(id: string, email: string, name: string): User {
  return {
    id,
    email: email.trim().toLowerCase(),
    name: name.trim() || 'Сотрудник',
    avatar: getRandomAvatar(),
    role: email.trim().toLowerCase() === CREATOR_EMAIL ? 'creator' : 'employee',
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
}

// Конвертация строки таблицы public.profiles (snake_case) в тип User.
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? '').trim().toLowerCase(),
    name: (row.name as string) || 'Сотрудник',
    avatar: (row.avatar as string) || '🙂',
    role: (['creator', 'admin', 'employee'].includes(String(row.role)) ? row.role : 'employee') as User['role'],
    department: (row.department as string) || 'Отдел продаж',
    level: Number(row.level ?? 1),
    xp: Number(row.xp ?? 0),
    xpToNext: Number(row.xp_to_next ?? 1000),
    streak: Number(row.streak ?? 0),
    plan: Number(row.plan ?? 0),
    fact: Number(row.fact ?? 0),
    salesCoins: Number(row.sales_coins ?? 0),
    profileColor: (row.profile_color as string) || 'pink',
    achievements: Array.isArray(row.achievements) ? row.achievements as UserAchievement[] : [],
    monthlyHistory: Array.isArray(row.monthly_history) ? row.monthly_history as MonthlyRecord[] : [],
    purchasedPrizes: Array.isArray(row.purchased_prizes) ? row.purchased_prizes as PurchasedPrize[] : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

// Чтение id пользователя из активной JWT-сессии Supabase (синхронно).
// Используется для мгновенного восстановления авторизованного состояния
// при обновлении страницы — до того, как профиль догрузится из Supabase.
function supabaseUserIdFromSession(): string | null {
  try {
    const raw = localStorage.getItem('sb-izhycodgxrnophnmemwo-auth-token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const userId = parsed?.currentSession?.user?.id ?? parsed?.session?.user?.id ?? null;
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}

// Обратная конвертация: User -> строка profiles (для upsert).
function userToRow(u: User): Record<string, unknown> {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    role: u.role,
    department: u.department,
    level: u.level,
    xp: u.xp,
    xp_to_next: u.xpToNext,
    streak: u.streak,
    plan: u.plan,
    fact: u.fact,
    sales_coins: u.salesCoins,
    profile_color: u.profileColor,
    achievements: u.achievements ?? [],
    monthly_history: u.monthlyHistory ?? [],
    purchased_prizes: u.purchasedPrizes ?? [],
    created_at: u.createdAt,
  };
}

// Извлечение человекочитаемого сообщения об ошибке из ответа Supabase.
function authErrorMessage(err: { message?: string; status?: number } | null, fallback: string): string {
  if (!err) return fallback;
  const m = (err.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Неверный email или пароль';
  if (m.includes('email not confirmed')) return 'Email не подтверждён. Проверьте почту и подтвердите регистрацию';
  if (m.includes('already registered') || m.includes('already exists') || m.includes('rate limit')) return 'Email уже зарегистрирован';
  if (m.includes('password should be at least') || m.includes('length')) return 'Пароль должен быть минимум 6 символов';
  if (m.includes('unable to validate email') || m.includes('email address')) return 'Некорректный email';
  if (m.includes('failed to fetch') || m.includes('networkerror')) return 'Нет связи с сервером. Попробуйте ещё раз';
  return err.message || fallback;
}

// ============ SHARED (GLOBAL) APP STATE IN SUPABASE ============
// Общие данные проекта — «план продаж», «бренд месяца», «акция месяца»,
// «важное объявление», «архив планов», челленджи, призы и шаблоны достижений —
// хранятся в единой серверной таблице public.app_state (одна строка id='global',
// jsonb-колонки по типам данных). Это источник истины для ВСЕХ участников:
// изменения любого администратора мгновенно видны всем остальным
// (через подписку Supabase Realtime на таблицу app_state).
// localStorage используется только как офлайн-кэш / страховка от потери данных.
export const GLOBAL_STATE_ID = 'global';

interface GlobalStateRow {
  prizes: Prize[];
  challenges: Challenge[];
  notifications: Notification[];
  department_plan: DepartmentPlan;
  plan_archives: MonthlyPlanArchive[];
  achievement_templates: AchievementTemplate[];
  company_settings: CompanySettings;
}

function globalStateToRow(s: GlobalStateRow): Record<string, unknown> {
  return {
    id: GLOBAL_STATE_ID,
    prizes: s.prizes,
    challenges: s.challenges,
    notifications: s.notifications,
    department_plan: s.department_plan,
    plan_archives: s.plan_archives,
    achievement_templates: s.achievement_templates,
    company_settings: s.company_settings,
    updated_at: new Date().toISOString(),
  };
}

// Миграция старых данных из localStorage: если админ уже что-то настроил
// локально (до появления серверного хранилища), эти значения становятся
// общими для всех участников при первой синхронизации.
function migrateLegacyLocalStorage(s: GlobalStateRow): void {
  try {
    const legacyDept = loadFromStorage<Partial<DepartmentPlan>>('sq_dept_plan', {});
    if (legacyDept && typeof legacyDept === 'object') {
      if (legacyDept.brandOfMonth !== undefined) s.department_plan.brandOfMonth = String(legacyDept.brandOfMonth);
      if (legacyDept.promoOfMonth !== undefined) s.department_plan.promoOfMonth = String(legacyDept.promoOfMonth);
      if (legacyDept.importantAnnouncements !== undefined) s.department_plan.importantAnnouncements = String(legacyDept.importantAnnouncements);
      if (typeof legacyDept.total === 'number' && legacyDept.total > 0) s.department_plan.total = legacyDept.total;
    }
    const legacyArchives = loadFromStorage<MonthlyPlanArchive[]>('sq_plan_archives', []);
    if (Array.isArray(legacyArchives) && legacyArchives.length > 0) {
      const known = new Set(s.plan_archives.map(a => a.id));
      s.plan_archives = [...s.plan_archives, ...legacyArchives.filter(a => a && !known.has(a.id))];
    }
    const legacyAchievements = loadFromStorage<AchievementTemplate[]>('sq_achievements', []);
    if (Array.isArray(legacyAchievements) && legacyAchievements.length > 0) {
      const known = new Set(s.achievement_templates.map(a => a.id));
      s.achievement_templates = [...s.achievement_templates, ...legacyAchievements.filter(a => a && !known.has(a.id))];
    }
    const legacyChallenges = loadFromStorage<Challenge[]>('sq_challenges', []);
    if (Array.isArray(legacyChallenges) && legacyChallenges.length > 0) {
      const known = new Set(s.challenges.map(c => c.id));
      s.challenges = [...s.challenges, ...legacyChallenges.filter(c => c && !known.has(c.id))];
    }
    const legacyPrizes = loadFromStorage<Prize[]>('sq_prizes', []);
    if (Array.isArray(legacyPrizes) && legacyPrizes.length > 0) {
      const known = new Set(s.prizes.map(p => p.id));
      s.prizes = [...s.prizes, ...legacyPrizes.filter(p => p && !known.has(p.id))];
    }
    const legacyNotifs = loadFromStorage<Notification[]>('sq_notifications', []);
    if (Array.isArray(legacyNotifs) && legacyNotifs.length > 0) {
      const known = new Set(s.notifications.map(n => n.id));
      s.notifications = [...s.notifications, ...legacyNotifs.filter(n => n && !known.has(n.id))];
    }
  } catch {
    // ignore migration errors
  }
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
  // Auth (Supabase Auth: email + пароль)
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => void;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
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
  // ============ AUTH STATE (Supabase Auth) ============
  // Регистрация и вход полностью переведены на встроенный Supabase Auth
  // (email + пароль). Пароли не хранятся в браузере: сессию (JWT) держит
  // сам supabase-js, а игровые данные пользователей — в таблице profiles.
  //
  // Кэш профиля по id активной JWT-сессии: при обновлении страницы профиль
  // ещё не догружен из Supabase, но UI должен остаться авторизованным и не
  // потерять последние изменения. Как только establishSession загрузит
  // актуальный профиль из public.profiles — currentUser подхватится сам.
  const sessionUserId = supabaseUserIdFromSession();
  const profileCacheKey = sessionUserId ? `sq_profile_${sessionUserId}` : null;
  const [users, setUsersState] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    profileCacheKey ? loadFromStorage<User | null>(profileCacheKey, null) : null
  );
  const [authLoading, setAuthLoading] = useState(true);
  const usersRef = useRef<User[]>([]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Загрузка всех профилей из Supabase (данные команды хранятся на сервере).
  // Опциональный keepIds — id «локальных» пользователей (например, только что
  // добавленного админом), которых ещё нет в ответе сервера: они сохраняются
  // в списке, чтобы не исчезнуть из UI до подтверждения записи в БД.
  const refreshProfiles = useCallback(async (keepIds?: string[]): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Не удалось загрузить профили из Supabase:', error.message);
      return usersRef.current;
    }
    const list = (data ?? []).map(rowToUser);
    setUsersState(prev => {
      const serverIds = new Set(list.map(u => u.id));
      const pending = prev.filter(u => keepIds?.includes(u.id) && !serverIds.has(u.id));
      return [...list, ...pending];
    });
    return list;
  }, []);

  // Upsert профиля в Supabase (луч-effort: UI обновляется оптимистично).
  const syncProfile = useCallback((u: User) => {
    supabase.from('profiles').upsert(userToRow(u)).then(({ error }) => {
      if (error) console.error('Не удалось сохранить профиль в Supabase:', error.message);
    });
  }, []);

  const upsertProfile = useCallback(async (u: User): Promise<boolean> => {
    const { error } = await supabase.from('profiles').upsert(userToRow(u));
    if (error) {
      console.error('Не удалось сохранить профиль в Supabase:', error.message);
      return false;
    }
    return true;
  }, []);

  // Восстановление сессии после логина/загрузки: гарантируем наличие профиля
  // в Supabase и делаем пользователя текущим.
  const establishSession = useCallback(async (sbUser: SupabaseAuthUser) => {
    const email = String(sbUser.email ?? '').trim().toLowerCase();
    const metaName = typeof sbUser.user_metadata?.name === 'string' ? sbUser.user_metadata.name : '';
    const metaAvatar = typeof sbUser.user_metadata?.avatar === 'string' ? sbUser.user_metadata.avatar : '';

    let profile = defaultProfileForNewUser(sbUser.id, email, metaName || 'Сотрудник');
    if (metaAvatar) profile.avatar = metaAvatar;

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .maybeSingle();

    if (existing) {
      profile = rowToUser(existing);
    } else {
      // Профиля ещё нет (триггер в БД не настроен или регистрация прошла без
      // него) — создаём сразу при первом входе.
      await upsertProfile(profile);
    }

    setCurrentUser(profile);
    await refreshProfiles([profile.id]);
  }, [upsertProfile, refreshProfiles]);

  // Подписка на состояние авторизации Supabase + восстановление сессии
  // при перезагрузке страницы (токран JWT хранит сам supabase-js).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (data.session?.user) {
        try { await establishSession(data.session.user); } catch (e) { console.error(e); }
      }
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUsersState([]);
        return;
      }
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        await establishSession(session.user);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [establishSession]);

  // Синхронизация currentUser с актуальным списком users (например, после
  // назначения администратора или изменения данных другим админом).
  useEffect(() => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const fresh = users.find(u => u.id === prev.id);
      if (!fresh) return null;
      if (JSON.stringify(fresh) !== JSON.stringify(prev)) return fresh;
      return prev;
    });
  }, [users]);

  // Каждое изменение текущего профиля сохраняется в Supabase (таблица
  // public.profiles) — все поля: name, avatar, role, department, level, xp,
  // xp_to_next, streak, plan, fact, sales_coins, profile_color, achievements,
  // monthly_history, purchased_prizes, created_at. Дебаунс 400 мс объединяет
  // частые обновления в один запрос. Дополнительно профиль кэшируется в
  // localStorage по id сессии — это страховка от потери несохранённых
  // изменений при мгновенном обновлении страницы (источник истины — Supabase:
  // при следующем входе данные подтягиваются из public.profiles).
  const lastSyncedRef = useRef<string>('');
  useEffect(() => {
    if (!currentUser) {
      lastSyncedRef.current = '';
      if (profileCacheKey) saveToStorage(profileCacheKey, null);
      return;
    }
    if (profileCacheKey) saveToStorage(profileCacheKey, currentUser);
    const serialized = JSON.stringify(userToRow(currentUser));
    if (serialized === lastSyncedRef.current) return;
    const timer = setTimeout(() => {
      lastSyncedRef.current = serialized;
      supabase.from('profiles').upsert(userToRow(currentUser)).then(({ error }) => {
        if (error) console.error('Не удалось сохранить профиль в Supabase:', error.message);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [currentUser, profileCacheKey]);

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

  // Кэш общих данных в localStorage (только для офлайна / миграции).
  useEffect(() => { saveToStorage('sq_prizes', prizes); }, [prizes]);
  useEffect(() => { saveToStorage('sq_challenges', challenges); }, [challenges]);
  useEffect(() => { saveToStorage('sq_notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('sq_dept_plan', departmentPlan); }, [departmentPlan]);
  useEffect(() => { saveToStorage('sq_plan_archives', planArchives); }, [planArchives]);
  useEffect(() => { saveToStorage('sq_achievements', achievementTemplates); }, [achievementTemplates]);
  useEffect(() => { saveToStorage('sq_settings', companySettings); }, [companySettings]);

  // ============ SYNC OF SHARED (GLOBAL) DATA WITH SUPABASE ============
  // Источник истины для «плана продаж», «бренда месяца», «акции месяца»,
  // «важного объявления», «архива планов», челленджей, призов и достижений —
  // серверная таблица public.app_state (строка id='global'). Любое изменение,
  // внесённое любым администратором, сохраняется на сервер и через Realtime
  // мгновенно рассылается всем остальным участникам проекта.

  // Флаг: актуальные общие данные уже загружены с сервера хотя бы раз.
  const globalLoadedRef = useRef(false);
  // Сериализованное состояние последней строки, загруженной/отправленной на
  // сервер — нужно, чтобы не перезаписывать сервер собственными же данными и
  // не зациклить realtime-обновления.
  const lastPushedGlobalRef = useRef<string>('');
  const globalSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGlobalSnapshot = useCallback((): GlobalStateRow => ({
    prizes,
    challenges,
    notifications,
    department_plan: departmentPlan,
    plan_archives: planArchives,
    achievement_templates: achievementTemplates,
    company_settings: companySettings,
  }), [prizes, challenges, notifications, departmentPlan, planArchives, achievementTemplates, companySettings]);

  // Применение строки app_state из Supabase к локальному состоянию.
  const applyGlobalRow = useCallback((row: Record<string, unknown> | null | undefined) => {
    if (!row) return;
    const defaultsDept = getDefaultDepartmentPlan();
    const defaultsSettings = getDefaultSettings();
    const dp = (row.department_plan && typeof row.department_plan === 'object')
      ? { ...defaultsDept, ...(row.department_plan as DepartmentPlan) } : defaultsDept;
    const cs = (row.company_settings && typeof row.company_settings === 'object')
      ? { ...defaultsSettings, ...(row.company_settings as CompanySettings) } : defaultsSettings;
    if (cs.name === 'SalesQuest') cs.name = 'EastAsia';

    setPrizes(Array.isArray(row.prizes) && (row.prizes as Prize[]).length > 0 ? row.prizes as Prize[] : getDefaultPrizes());
    setChallenges(Array.isArray(row.challenges) ? row.challenges as Challenge[] : []);
    setNotifications(Array.isArray(row.notifications) ? row.notifications as Notification[] : []);
    setDepartmentPlan(dp);
    setPlanArchives(Array.isArray(row.plan_archives) ? row.plan_archives as MonthlyPlanArchive[] : []);
    setAchievementTemplates(Array.isArray(row.achievement_templates) ? row.achievement_templates as AchievementTemplate[] : []);
    setCompanySettings(cs);
    globalLoadedRef.current = true;
    lastPushedGlobalRef.current = JSON.stringify(globalStateToRow({
      prizes: Array.isArray(row.prizes) && (row.prizes as Prize[]).length > 0 ? row.prizes as Prize[] : getDefaultPrizes(),
      challenges: Array.isArray(row.challenges) ? row.challenges as Challenge[] : [],
      notifications: Array.isArray(row.notifications) ? row.notifications as Notification[] : [],
      department_plan: dp,
      plan_archives: Array.isArray(row.plan_archives) ? row.plan_archives as MonthlyPlanArchive[] : [],
      achievement_templates: Array.isArray(row.achievement_templates) ? row.achievement_templates as AchievementTemplate[] : [],
      company_settings: cs,
    }));
  }, []);

  // Начальная загрузка общих данных с сервера (после входа — RLS требует
  // authenticated). Если строки ещё нет — создаём её из локальных значений
  // (в т.ч. мигрированных из старого localStorage), чтобы они стали общими.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('app_state')
          .select('*')
          .eq('id', GLOBAL_STATE_ID)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error('Не удалось загрузить общие данные из Supabase:', error.message);
          return;
        }
        if (data) {
          applyGlobalRow(data as Record<string, unknown>);
        } else {
          // Первый запуск: публикуем локальные (мигрированные) настройки как общие.
          const initial = currentGlobalSnapshot();
          migrateLegacyLocalStorage(initial);
          const row = globalStateToRow(initial);
          lastPushedGlobalRef.current = JSON.stringify(row);
          const { error: upErr } = await supabase.from('app_state').upsert(row);
          if (upErr) {
            console.error('Не удалось создать общие данные в Supabase:', upErr.message);
            lastPushedGlobalRef.current = '';
          } else {
            globalLoadedRef.current = true;
            // Применяем смигрированные значения и к текущему клиенту.
            setPrizes(initial.prizes);
            setChallenges(initial.challenges);
            setNotifications(initial.notifications);
            setDepartmentPlan(initial.department_plan);
            setPlanArchives(initial.plan_archives);
            setAchievementTemplates(initial.achievement_templates);
            setCompanySettings(initial.company_settings);
          }
        }
      } catch (e) {
        console.error('Ошибка загрузки общих данных:', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Отправка изменений общих данных на сервер (дебаунс 350 мс объединяет
  // частые обновления в один запрос). Отправляем только после того, как
  // серверное состояние было получено — иначе есть риск затереть чужие данные.
  useEffect(() => {
    if (!currentUser) return;
    if (!globalLoadedRef.current) return;
    const snapshot = currentGlobalSnapshot();
    // План отдела (total/current/percentage) пересчитывается из профилей на
    // каждом клиенте — это производные величины, игнорируем их при сравнении,
    // чтобы не создавать лишних записей на сервер.
    const stripVolatile = (s: GlobalStateRow) => JSON.stringify(globalStateToRow({
      ...s,
      department_plan: { ...s.department_plan, total: 0, current: 0, percentage: 0 },
    }));
    const serialized = stripVolatile(snapshot);
    if (serialized === lastPushedGlobalRef.current) return;
    if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current);
    globalSyncTimerRef.current = setTimeout(() => {
      lastPushedGlobalRef.current = serialized;
      supabase.from('app_state').upsert(globalStateToRow(snapshot)).then(({ error }) => {
        if (error) {
          console.error('Не удалось сохранить общие данные в Supabase:', error.message);
          lastPushedGlobalRef.current = '';
        }
      });
    }, 350);
    return () => { if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizes, challenges, notifications, departmentPlan.brandOfMonth, departmentPlan.promoOfMonth,
      departmentPlan.importantAnnouncements, departmentPlan.month, departmentPlan.year, departmentPlan.lastMonth,
      planArchives, achievementTemplates, companySettings, currentUser]);

  // Realtime: мгновенно получаем изменения общих данных от других участников.
  useEffect(() => {
    if (!currentUser) return;
    try {
      const channel = supabase
        .channel(`app_state_${GLOBAL_STATE_ID}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'app_state', filter: `id=eq.${GLOBAL_STATE_ID}` },
          (payload: { eventType?: string; new?: Record<string, unknown> }) => {
            if (payload.eventType === 'DELETE') return;
            const row = payload.new;
            if (!row) return;
            // Игнорируем эхо собственных записей (сверка без volatile-полей).
            const strip = (r: Record<string, unknown>) => {
              const dp = (r.department_plan ?? {}) as Partial<DepartmentPlan>;
              return JSON.stringify({ ...r, department_plan: { ...dp, total: 0, current: 0, percentage: 0 } });
            };
            if (lastPushedGlobalRef.current && strip(row) === lastPushedGlobalRef.current) return;
            applyGlobalRow(row);
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

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

  // ============ AUTH ACTIONS (Supabase Auth: email + пароль) ============

  // Вход: проверка логина/пароля выполняется сервером Supabase (GoTrue).
  // В браузере не хранится ничего, кроме JWT-сессии, которую держит supabase-js.
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Нормализуем ввод: мобильные клавиатуры и автозаполнение часто добавляют
    // пробелы/регистр — из-за этого «правильный» email не находился.
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { success: false, error: 'Введите email и пароль' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      return { success: false, error: authErrorMessage(error, 'Ошибка сервера. Попробуйте ещё раз') };
    }
    if (data.session?.user) {
      // Загружаем (или создаём) профиль в public.profiles и делаем его текущим.
      await establishSession(data.session.user);
    }
    return { success: true };
  }, [establishSession]);

  // Регистрация: создаём аккаунт во встроенном Supabase Auth (email + пароль),
  // профиль — в таблице public.profiles. Пароль в localStorage не сохраняется.
  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Введите email' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Пароль должен быть минимум 6 символов' };
    }
    if (!name.trim()) {
      return { success: false, error: 'Введите имя' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: name.trim(), avatar: getRandomAvatar() },
      },
    });
    if (error) {
      return { success: false, error: authErrorMessage(error, 'Ошибка сервера. Попробуйте ещё раз') };
    }

    // Если в проекте Supabase включено подтверждение email, сессия может
    // отсутствовать — просим подтвердить почту, затем войти.
    if (!data.session) {
      return {
        success: false,
        needsConfirmation: true,
        error: 'Регистрация прошла! Проверьте почту и подтвердите адрес, затем войдите.',
      };
    }

    // Сессия есть — регистрируем профиль и входим сразу.
    if (data.user) {
      await establishSession(data.user);
    }

    // Приветственное уведомление новому сотруднику.
    const welcomeNotif: Notification = {
      id: generateId(),
      userId: data.user?.id ?? '',
      title: 'Добро пожаловать!',
      message: `Рады видеть вас в ${companySettings.name}! 🎉`,
      emoji: '👋',
      time: 'Только что',
      read: false,
    };
    setNotifications(prev => [welcomeNotif, ...prev]);

    return { success: true };
  }, [companySettings.name, establishSession]);

  // Повторная отправка письма подтверждения (актуально, если в проекте
  // включено подтверждение email).
  const resendConfirmation = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Введите email' };
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
    if (error) {
      return { success: false, error: authErrorMessage(error, 'Ошибка сервера. Попробуйте ещё раз') };
    }
    return { success: true };
  }, []);

  // Выход: завершаем сессию на стороне Supabase; onAuthStateChange (событие
  // SIGNED_OUT) дополнительно сбросит состояние. Кэш профиля в localStorage
  // удаляется, чтобы при следующем входе данные брались только из Supabase.
  const logout = useCallback(() => {
    void supabase.auth.signOut();
    setCurrentUser(null);
    setUsersState([]);
    if (profileCacheKey) saveToStorage(profileCacheKey, null);
  }, [profileCacheKey]);

  const updateCurrentUser = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsersState(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  }, [currentUser]);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsersState(prev => prev.map(u => {
      if (u.id !== id) return u;
      const updated = { ...u, ...data };
      // Изменения, внесённые админом (план, факт, имя, отдел, роль), сразу
      // сохраняются в Supabase — иначе они исчезнут при обновлении страницы.
      syncProfile(updated);
      return updated;
    }));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : prev);
    }
  }, [currentUser, syncProfile]);

  const removeUser = useCallback((id: string) => {
    setUsersState(prev => prev.filter(u => u.id !== id));
    // Удаляем профиль из Supabase (аккаунт Auth может остаться — удаление
    // пользователя Auth требует service-role ключа на сервере).
    supabase.from('profiles').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Не удалось удалить профиль из Supabase:', error.message);
    });
  }, []);

  // Смена роли должна обновлять и currentUser (он хранится отдельно от users),
  // иначе назначенный админ не получает права до перезахода, а у создателя
  // пропадает доступ к «Управлению командой» после смены роли.
  const changeUserRole = useCallback((id: string, role: 'admin' | 'employee') => {
    setUsersState(prev => prev.map(u => {
      if (u.id !== id || u.role === 'creator') return u;
      const updated = { ...u, role };
      syncProfile(updated); // сохраняем роль в Supabase (public.profiles)
      return updated;
    }));
    setCurrentUser(prev => {
      if (!prev || prev.id !== id || prev.role === 'creator') return prev;
      return { ...prev, role };
    });
  }, [syncProfile]);

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

    // Начисляем награду только этому пользователю и сохраняем её в Supabase,
    // иначе купленные/заработанные монеты исчезнут при обновлении страницы.
    setUsersState(usersPrev => usersPrev.map(u => {
      if (u.id !== userId) return u;
      const updated = { ...u, salesCoins: u.salesCoins + challenge.xpReward };
      syncProfile(updated);
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
  }, [challenges, currentUser, syncProfile]);

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
      setUsersState(prev => prev.map(u => 
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
    setUsersState(prev => prev.map(u => {
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

        // Сохраняем достижение и монеты в Supabase — иначе они исчезнут
        // при обновлении страницы или перезаходе на аккаунт.
        syncProfile(updatedUser);

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
  }, [achievementTemplates, currentUser, syncProfile]);

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      isAuthenticated: !!currentUser,
      authLoading,
      resendConfirmation,
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

