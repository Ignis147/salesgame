import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ============ TYPES ============
export interface User {
  id: string;
  email: string;
  password: string;
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
  userId: string; // 'global' для общих, или ID пользователя для персональных
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  progress: number;
  total: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'seasonal';
  assignedTo?: string[]; // ID пользователей, которым назначен челлендж (если не global)
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
const CREATOR_EMAIL = 'ignis.kwork@gmal.com';
const CREATOR_PASSWORD = 'admin123';

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
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
  // Auth
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (email: string, password: string, name: string) => { success: boolean; error?: string };
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

  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updateDepartmentPlan: (data: Partial<DepartmentPlan>) => void;
  updateCompanySettings: (data: Partial<CompanySettings>) => void;
  
  archiveCurrentMonthPlan: () => void;
  updatePlanArchive: (id: string, data: Partial<MonthlyPlanArchive>) => void;
  removePlanArchive: (id: string) => void;

  spendCoins: (amount: number) => void;

  // Achievements management (admin only)
  achievementTemplates: AchievementTemplate[];
  addAchievementTemplate: (template: AchievementTemplate) => void;
  updateAchievementTemplate: (id: string, data: Partial<AchievementTemplate>) => void;
  removeAchievementTemplate: (id: string) => void;
  grantAchievementToUser: (userId: string, achievementId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const stored = loadFromStorage<User[]>('sq_users', []);
    
    // Создаём создателя по умолчанию
    const creator: User = {
      id: 'creator-1',
      email: CREATOR_EMAIL,
      password: CREATOR_PASSWORD,
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
    };
    
    // Проверяем, есть ли создатель в сохранённых данных
    const hasCreator = stored.some(u => u.email === CREATOR_EMAIL);
    
    if (hasCreator) {
      // Если создатель есть, возвращаем сохранённых пользователей
      return stored;
    } else {
      // Если создателя нет, добавляем его к сохранённым пользователям
      return [creator, ...stored];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return loadFromStorage<User | null>('sq_current_user', null);
  });

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

  // Persist to localStorage
  useEffect(() => { saveToStorage('sq_users', users); }, [users]);
  useEffect(() => { saveToStorage('sq_current_user', currentUser); }, [currentUser]);
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
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Пользователь не найден' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Неверный пароль' };
    }
    setCurrentUser(user);
    return { success: true };
  }, [users]);

  const register = useCallback((email: string, password: string, name: string) => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
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
    if (email.toLowerCase() === CREATOR_EMAIL) {
      role = 'creator';
    }

    const newUser: User = {
      id: generateId(),
      email,
      password,
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

  const promoteToAdmin = useCallback((id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'admin' as const } : u));
  }, []);

  const demoteFromAdmin = useCallback((id: string) => {
    setUsers(prev => prev.map(u => u.id === id && u.role !== 'creator' ? { ...u, role: 'employee' as const } : u));
  }, []);

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

  const grantAchievementToUser = useCallback((userId: string, achievementId: string) => {
    const template = achievementTemplates.find(a => a.id === achievementId);
    if (!template) return;

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

        return updatedUser;
      }
      return u;
    }));
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
