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
export const CREATOR_PASSWORD = '';

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
  const [users, setUsersState] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const usersRef = useRef<User[]>([]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Загрузка всех профилей из Supabase (данные команды хранятся на сервере).
  const refreshProfiles = useCallback(async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Не удалось загрузить профили из Supabase:', error.message);
      return usersRef.current;
    }
    const list = (data ?? []).map(rowToUser);
    setUsersState(list);
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
    await refreshProfiles();
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

  // Персист общих (не связанных с авторизацией) данных приложения.
  // ВАЖНО: пользователи и сессия больше НЕ сохраняются в localStorage —
  // их источниками истины являются Supabase Auth и таблица public.profiles.
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

  const login = useCallback((email: string, password: string) => {
    // Нормализуем ввод: мобильные клавиатуры и автозаполнение часто добавляют
    // пробелы/регистр — из-за этого «правильный» email не находился.
    const normalizedEmail = email.trim().toLowerCase();
    // Ищем по актуальному снимку хранилища, а не только по state: если другая
    // вкладка/сессия уже сохранила регистрацию, вход сработает сразу.
    const list = readStoredUsers();
    let user = list.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user && users.length !== list.length) {
      user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    }
    if (!user) {
      return { success: false, error: 'Пользователь не найден' };
    }
    if (!verifyPassword(user.password, password)) {
      return { success: false, error: 'Неверный пароль' };
    }
    // Миграция легаси-записей: храним только дайджест (открытый пароль больше
    // не сохраняется и не синхронизируется между устройствами).
    const digest = hashPassword(password);
    if (user.password !== digest) {
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, password: digest } : u)));
    }
    setCurrentUser({ ...user, password: digest });
    return { success: true };
  }, [users, readStoredUsers, setUsers]);

  const register = useCallback((email: string, password: string, name: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    // Проверяем и state, и хранилище — пользователь мог быть зарегистрирован
    // в другой вкладке, но ещё не попасть в текущий state.
    const existing = readStoredUsers().some(u => u.email.toLowerCase() === normalizedEmail)
      || users.some(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'Email уже зарегистрирован' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Пароль должен быть минимум 6 символов' };
    }
    if (!name.trim()) {
      return { success: false, error: 'Введите имя' };
    }

    // Check if this email is the creator
    let role: 'creator' | 'admin' | 'employee' = 'employee';
    if (normalizedEmail === CREATOR_EMAIL) {
      role = 'creator';
    }

    const newUser: User = {
      id: generateId(),
      email: normalizedEmail,
      // Храним только дайджест пароля — открытый пароль не попадает ни в
      // localStorage, ни в синхронизацию между устройствами.
      password: hashPassword(password),
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

    setUsers(prev => [...prev, newUser]);
    
    // После регистрации всегда делаем нового пользователя текущим
    setCurrentUser(newUser);

    // Add welcome notification
    const welcomeNotif: Notification = {
      id: generateId(),
      userId: newUser.id,
      title: 'Добро пожаловать!',
      message: `Рады видеть вас в ${companySettings.name}! 🎉`,
      emoji: '👋',
      time: 'Только что',
      read: false,
    };
    setNotifications(prev => [welcomeNotif, ...prev]);

    return { success: true };
  }, [users, companySettings.name]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sq_current_user');
  }, []);

  const updateCurrentUser = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  }, [currentUser]);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : prev);
    }
  }, [currentUser]);

  const removeUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  // Смена роли должна обновлять и currentUser (он хранится отдельно от users),
  // иначе назначенный админ не получает права до перезахода, а у создателя
  // пропадает доступ к «Управлению командой» после смены роли.
  const changeUserRole = useCallback((id: string, role: 'admin' | 'employee') => {
    setUsers(prev => prev.map(u => u.id === id && u.role !== 'creator' ? { ...u, role } : u));
    setCurrentUser(prev => {
      if (!prev || prev.id !== id || prev.role === 'creator') return prev;
      const updated = { ...prev, role };
      // Сессию сохраняем без пароля (см. эффект персиста sq_current_user)
      const { password: _pw, ...sessionUser } = updated;
      saveToStorage('sq_current_user', sessionUser);
      return updated;
    });
  }, [setUsers]);

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
      return { ...u, salesCoins: u.salesCoins + challenge.xpReward };
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
