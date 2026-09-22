export interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: 'manager' | 'employee';
  department: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  plan: number;
  fact: number;
  achievements: Achievement[];
  monthlyHistory: MonthlyRecord[];
}

export interface MonthlyRecord {
  month: string;
  plan: number;
  fact: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  date: string;
  isNew?: boolean;
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
  progress: number;
  total: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'seasonal';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  emoji: string;
  time: string;
  read: boolean;
}

export const rarityColors = {
  common: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', label: '⚪ Обычное' },
  uncommon: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', label: '🟢 Необычное' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', label: '🔵 Редкое' },
  epic: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600', label: '🟣 Эпическое' },
  legendary: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-600', label: '🟡 Легендарное' },
};

export const currentUser: Employee = {
  id: '1',
  name: 'Анастасия К.',
  avatar: '👩‍💼',
  role: 'employee',
  department: 'Отдел продаж №1',
  level: 12,
  xp: 2450,
  xpToNext: 3000,
  streak: 14,
  plan: 500000,
  fact: 425000,
  achievements: [
    { id: '1', name: 'Первый полет', emoji: '🐣', description: 'Первый выполненный план продаж', rarity: 'common', date: '2024-01-15' },
    { id: '2', name: 'План? Какой план? Я уже впереди!', emoji: '🏆', description: 'Выполнение плана более 110%', rarity: 'epic', date: '2024-02-20' },
    { id: '3', name: 'На волне успеха', emoji: '🌸', description: 'Выполнение плана 2 месяца подряд', rarity: 'uncommon', date: '2024-03-01' },
    { id: '4', name: 'Королева акций', emoji: '🎉', description: 'Продажи по акции месяца', rarity: 'rare', date: '2024-03-15' },
    { id: '5', name: 'Мисс Пунктуальность', emoji: '⏰', description: 'Выполнение плана без просроченных дней', rarity: 'epic', date: '2024-04-01' },
    { id: '6', name: 'Звезда отдела', emoji: '🥇', description: 'Лучший результат месяца', rarity: 'legendary', date: '2024-04-30' },
    { id: '7', name: 'Алмаз среди скидок', emoji: '♻️', description: 'Продажи склада брака и уценки', rarity: 'rare', date: '2024-05-10' },
  ],
  monthlyHistory: [
    { month: 'Янв', plan: 400000, fact: 420000, percentage: 105 },
    { month: 'Фев', plan: 450000, fact: 510000, percentage: 113 },
    { month: 'Мар', plan: 450000, fact: 470000, percentage: 104 },
    { month: 'Апр', plan: 500000, fact: 560000, percentage: 112 },
    { month: 'Май', plan: 500000, fact: 425000, percentage: 85 },
    { month: 'Июн', plan: 500000, fact: 0, percentage: 0 },
  ],
};

export const teamMembers: Employee[] = [
  { ...currentUser, id: '1' },
  {
    id: '2', name: 'Елена М.', avatar: '👩‍🦰', role: 'employee', department: 'Отдел продаж №1',
    level: 15, xp: 3200, xpToNext: 3500, streak: 21, plan: 500000, fact: 480000,
    achievements: [
      { id: '1', name: 'Не остановить', emoji: '🔥', description: '3 месяца подряд', rarity: 'rare', date: '2024-03-01' },
      { id: '2', name: 'Императрица продаж', emoji: '👑', description: 'Лучший результат квартала', rarity: 'legendary', date: '2024-04-01' },
    ],
    monthlyHistory: [],
  },
  {
    id: '3', name: 'Мария Д.', avatar: '👩‍🦱', role: 'employee', department: 'Отдел продаж №1',
    level: 10, xp: 1800, xpToNext: 2500, streak: 7, plan: 500000, fact: 390000,
    achievements: [
      { id: '1', name: 'Первый полет', emoji: '🐣', description: 'Первый выполненный план', rarity: 'common', date: '2024-02-01' },
    ],
    monthlyHistory: [],
  },
  {
    id: '4', name: 'Ольга С.', avatar: '💁‍♀️', role: 'employee', department: 'Отдел продаж №1',
    level: 18, xp: 4100, xpToNext: 4500, streak: 30, plan: 500000, fact: 520000,
    achievements: [
      { id: '1', name: 'Продажная богиня', emoji: '💎', description: '12 месяцев подряд', rarity: 'legendary', date: '2024-01-01' },
      { id: '2', name: 'Легенда компании', emoji: '✨', description: 'Лучший результат года', rarity: 'legendary', date: '2024-01-01' },
    ],
    monthlyHistory: [],
  },
  {
    id: '5', name: 'Дарья В.', avatar: '🧕', role: 'employee', department: 'Отдел продаж №1',
    level: 8, xp: 1200, xpToNext: 2000, streak: 3, plan: 500000, fact: 310000,
    achievements: [],
    monthlyHistory: [],
  },
  {
    id: '6', name: 'Кристина Л.', avatar: '👱‍♀️', role: 'employee', department: 'Отдел продаж №1',
    level: 11, xp: 2100, xpToNext: 2800, streak: 10, plan: 500000, fact: 445000,
    achievements: [
      { id: '1', name: 'Ракета месяца', emoji: '📈', description: 'Самый большой рост', rarity: 'epic', date: '2024-05-01' },
    ],
    monthlyHistory: [],
  },
];

export const departmentPlan = {
  total: 3000000,
  current: 2570000,
  percentage: 85.7,
  lastMonth: 82.3,
  employees: 6,
};

export const prizes: Prize[] = [
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

export const challenges: Challenge[] = [
  { id: '1', title: 'Утренняя продуктивность', description: 'Зайди в приложение до 9:00', emoji: '🌅', xpReward: 50, progress: 1, total: 1, deadline: 'Сегодня', type: 'daily' },
  { id: '2', title: 'Звонок-марафон', description: 'Сделай 15 звонков клиентам', emoji: '📞', xpReward: 150, progress: 9, total: 15, deadline: 'Сегодня', type: 'daily' },
  { id: '3', title: 'Мастер презентации', description: 'Проведи 5 презентаций продукта', emoji: '🎯', xpReward: 300, progress: 3, total: 5, deadline: 'Пятница', type: 'weekly' },
  { id: '4', title: 'Закрывашка', description: 'Закрой 3 сделки на сумму от 50 000₽', emoji: '💰', xpReward: 500, progress: 1, total: 3, deadline: 'Конец месяца', type: 'weekly' },
  { id: '5', title: 'Летний спринт', description: 'Выполни план на 120% за месяц', emoji: '🌞', xpReward: 1000, progress: 85, total: 120, deadline: '30 июня', type: 'seasonal' },
];

export const notifications: Notification[] = [
  { id: '1', title: 'Новое достижение!', message: 'Вы получили значок "Мисс Пунктуальность" ⏰', emoji: '🏅', time: '2 мин назад', read: false },
  { id: '2', title: 'Почти у цели!', message: 'Осталось 5% до награды "План? Какой план?"', emoji: '🎯', time: '1 час назад', read: false },
  { id: '3', title: 'Новый челлендж!', message: 'Доступен еженедельный челлендж "Мастер презентации"', emoji: '🎮', time: '3 часа назад', read: true },
  { id: '4', title: 'Вы в ТОП-3!', message: 'Поздравляем! Вы вошли в тройку лучших сотрудников', emoji: '🏆', time: 'Вчера', read: true },
  { id: '5', title: 'Новый месяц!', message: 'Июнь начался! Новые цели и возможности 🌟', emoji: '📅', time: '2 дня назад', read: true },
];

export const battlePassSeason = {
  name: 'Летний сезон 2024',
  emoji: '🌞',
  level: 8,
  maxLevel: 30,
  rewards: [
    { level: 1, reward: '50 Sales Coins', emoji: '🪙', claimed: true },
    { level: 2, reward: 'Значок "Лето"', emoji: '🏖️', claimed: true },
    { level: 3, reward: '100 Sales Coins', emoji: '🪙', claimed: true },
    { level: 5, reward: 'Сертификат кофе', emoji: '☕', claimed: true },
    { level: 8, reward: 'Рамка профиля', emoji: '🖼️', claimed: false, current: true },
    { level: 10, reward: '300 Sales Coins', emoji: '🪙', claimed: false },
    { level: 15, reward: 'SPA-день', emoji: '💆‍♀️', claimed: false },
    { level: 20, reward: 'Золотой значок', emoji: '✨', claimed: false },
    { level: 25, reward: '1000 Sales Coins', emoji: '💰', claimed: false },
    { level: 30, reward: 'Легендарный титул', emoji: '👑', claimed: false },
  ],
};
