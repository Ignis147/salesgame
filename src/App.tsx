import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import {
  rarityColors, type Achievement
} from './data/mockData';
import { AppProvider, useAppState } from './store/AppContext';
import {
  Home, Trophy, Gift, BarChart3, Users, Bell, Settings, Moon, Sun,
  Target, TrendingUp, Crown, Sparkles, Star,
  Medal, Calendar, Award, Zap, ArrowLeft,
  Menu, X, Check, Lock, Coins, Trash2, Edit3, Plus, Save, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';

type View = 'home' | 'achievements' | 'shop' | 'leaderboard' | 'analytics' | 'profile' | 'challenges' | 'battlepass' | 'notifications' | 'team' | 'settings';

// Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-medium text-sm">
        <Check size={18} />
        {message}
      </div>
    </motion.div>
  );
}

function AppContent() {
  const {
    currentUser, teamMembers, departmentPlan, prizes, challenges,
    notifications, battlePass, companySettings, salesCoins, userRole,
    updateCurrentUser, updateTeamMember, removeTeamMember, addTeamMember,
    updateDepartmentPlan, updatePrize, removePrize, addPrize,
    spendCoins, markNotificationRead, markAllNotificationsRead,
    updateCompanySettings, setUserRole,
  } = useAppState();

  const [currentView, setCurrentView] = useState<View>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState<Achievement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter(n => !n.read).length
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAchievementPopup({
        id: 'new', name: 'Мисс Пунктуальность', emoji: '⏰',
        description: 'Выполнение плана без просроченных дней',
        rarity: 'epic', date: new Date().toISOString().split('T')[0]
      });
      setShowConfetti(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  useEffect(() => {
    setUnreadNotifications(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const themeClass = darkMode ? 'dark' : '';

  const handleMarkNotifRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleSpendCoins = (amount: number, prizeName: string) => {
    if (salesCoins >= amount) {
      spendCoins(amount);
      showToast(`🎉 Вы обменяли "${prizeName}"! Ожидайте подтверждения.`);
    }
  };

  return (
    <div className={`${themeClass} min-h-screen font-['Nunito',sans-serif]`}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 text-gray-800'}`}>
        {showConfetti && <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#ff69b4', '#ffd700', '#87ceeb', '#98fb98', '#dda0dd']} />}

        {/* Achievement Popup */}
        <AnimatePresence>
          {showAchievementPopup && (
            <motion.div
              initial={{ opacity: 0, y: -100, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, scale: 0.5 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
              <div className={`relative p-6 rounded-3xl shadow-2xl border-2 ${rarityColors[showAchievementPopup.rarity].bg} ${rarityColors[showAchievementPopup.rarity].border} backdrop-blur-xl`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-4 py-1 rounded-full font-bold">
                  ✨ НОВОЕ ДОСТИЖЕНИЕ ✨
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl mb-2 animate-bounce">{showAchievementPopup.emoji}</div>
                  <h3 className="font-bold text-lg">{showAchievementPopup.name}</h3>
                  <p className={`text-sm ${rarityColors[showAchievementPopup.rarity].text}`}>{rarityColors[showAchievementPopup.rarity].label}</p>
                  <p className="text-sm opacity-70 mt-1">{showAchievementPopup.description}</p>
                  <button
                    onClick={() => setShowAchievementPopup(null)}
                    className="mt-3 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all"
                  >
                    Ура! 🎉
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </AnimatePresence>

        {/* Header */}
        <header className={`sticky top-0 z-40 backdrop-blur-xl ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/70 border-white/50'} border-b`}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent hidden sm:block">
                  {companySettings.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Role Switch */}
              <div className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-pink-100 to-purple-100'}`}>
                <button
                  onClick={() => setUserRole('employee')}
                  className={`px-2 py-1 rounded-full transition-all ${userRole === 'employee' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : ''}`}
                >
                  👩‍💼 Сотрудник
                </button>
                <button
                  onClick={() => setUserRole('manager')}
                  className={`px-2 py-1 rounded-full transition-all ${userRole === 'manager' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : ''}`}
                >
                  👑 Руководитель
                </button>
              </div>

              {/* Coins */}
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-gradient-to-r from-yellow-100 to-amber-100'}`}>
                <span className="text-sm">🪙</span>
                <span className="font-bold text-sm text-amber-600">{salesCoins}</span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setCurrentView('notifications')}
                className="relative p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-800 transition-all"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-800 transition-all"
              >
                {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
              </button>

              {/* Avatar */}
              <button
                onClick={() => setCurrentView('profile')}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-lg shadow-md"
              >
                {currentUser.avatar}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto flex">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 min-h-[calc(100vh-64px)] p-4 sticky top-16">
            <nav className="space-y-1">
              <SidebarItem icon={<Home size={20} />} label="Главная" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
              <SidebarItem icon={<Trophy size={20} />} label="Достижения" active={currentView === 'achievements'} onClick={() => setCurrentView('achievements')} />
              <SidebarItem icon={<Zap size={20} />} label="Челленджи" active={currentView === 'challenges'} onClick={() => setCurrentView('challenges')} />
              <SidebarItem icon={<Gift size={20} />} label="Магазин наград" active={currentView === 'shop'} onClick={() => setCurrentView('shop')} />
              <SidebarItem icon={<Crown size={20} />} label="Боевой пропуск" active={currentView === 'battlepass'} onClick={() => setCurrentView('battlepass')} />
              <SidebarItem icon={<Medal size={20} />} label="Рейтинг" active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} />
              {userRole === 'manager' && (
                <>
                  <SidebarItem icon={<BarChart3 size={20} />} label="Аналитика" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
                  <SidebarItem icon={<Users size={20} />} label="Команда" active={currentView === 'team'} onClick={() => setCurrentView('team')} />
                </>
              )}
              <SidebarItem icon={<Settings size={20} />} label="Настройки" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
            </nav>

            {/* Streak Card */}
            <div className={`mt-6 p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-orange-100 to-pink-100'} border ${darkMode ? 'border-gray-700' : 'border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔥</span>
                <span className="font-bold text-sm">Серия: {currentUser.streak} дней</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i < Math.min(currentUser.streak % 7 || 7, 5) ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {i < Math.min(currentUser.streak % 7 || 7, 5) ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
                <div className={`absolute left-0 top-0 bottom-0 w-72 p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl overflow-y-auto`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">{companySettings.name}</h2>
                    <button onClick={() => setShowMobileMenu(false)}><X size={24} /></button>
                  </div>
                  <nav className="space-y-1">
                    <SidebarItem icon={<Home size={20} />} label="Главная" active={currentView === 'home'} onClick={() => { setCurrentView('home'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Trophy size={20} />} label="Достижения" active={currentView === 'achievements'} onClick={() => { setCurrentView('achievements'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Zap size={20} />} label="Челленджи" active={currentView === 'challenges'} onClick={() => { setCurrentView('challenges'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Gift size={20} />} label="Магазин наград" active={currentView === 'shop'} onClick={() => { setCurrentView('shop'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Crown size={20} />} label="Боевой пропуск" active={currentView === 'battlepass'} onClick={() => { setCurrentView('battlepass'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Medal size={20} />} label="Рейтинг" active={currentView === 'leaderboard'} onClick={() => { setCurrentView('leaderboard'); setShowMobileMenu(false); }} />
                    {userRole === 'manager' && (
                      <>
                        <SidebarItem icon={<BarChart3 size={20} />} label="Аналитика" active={currentView === 'analytics'} onClick={() => { setCurrentView('analytics'); setShowMobileMenu(false); }} />
                        <SidebarItem icon={<Users size={20} />} label="Команда" active={currentView === 'team'} onClick={() => { setCurrentView('team'); setShowMobileMenu(false); }} />
                      </>
                    )}
                    <SidebarItem icon={<Settings size={20} />} label="Настройки" active={currentView === 'settings'} onClick={() => { setCurrentView('settings'); setShowMobileMenu(false); }} />
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-64px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentView === 'home' && <HomeView darkMode={darkMode} userRole={userRole} showToast={showToast} />}
                {currentView === 'achievements' && <AchievementsView darkMode={darkMode} />}
                {currentView === 'shop' && <ShopView darkMode={darkMode} onSpend={handleSpendCoins} />}
                {currentView === 'leaderboard' && <LeaderboardView darkMode={darkMode} />}
                {currentView === 'analytics' && <AnalyticsView darkMode={darkMode} showToast={showToast} />}
                {currentView === 'profile' && <ProfileView darkMode={darkMode} showToast={showToast} />}
                {currentView === 'challenges' && <ChallengesView darkMode={darkMode} showToast={showToast} />}
                {currentView === 'battlepass' && <BattlePassView darkMode={darkMode} />}
                {currentView === 'notifications' && <NotificationsView darkMode={darkMode} onMarkRead={handleMarkNotifRead} onMarkAllRead={handleMarkAllRead} />}
                {currentView === 'team' && <TeamView darkMode={darkMode} showToast={showToast} />}
                {currentView === 'settings' && <SettingsView darkMode={darkMode} showToast={showToast} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className={`fixed bottom-0 left-0 right-0 lg:hidden ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} border-t backdrop-blur-xl z-40`}>
          <div className="flex justify-around py-2">
            <MobileNavItem icon={<Home size={20} />} label="Главная" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
            <MobileNavItem icon={<Trophy size={20} />} label="Значки" active={currentView === 'achievements'} onClick={() => setCurrentView('achievements')} />
            <MobileNavItem icon={<Zap size={20} />} label="Квесты" active={currentView === 'challenges'} onClick={() => setCurrentView('challenges')} />
            <MobileNavItem icon={<Medal size={20} />} label="Рейтинг" active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} />
            <MobileNavItem icon={<Gift size={20} />} label="Призы" active={currentView === 'shop'} onClick={() => setCurrentView('shop')} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

// Sidebar Item Component
function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
          : 'hover:bg-pink-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Mobile Nav Item
function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${active ? 'text-pink-500' : 'text-gray-400'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ==================== HOME VIEW ====================
function HomeView({ darkMode, userRole, showToast }: { darkMode: boolean; userRole: string; showToast: (m: string) => void }) {
  const { currentUser, departmentPlan, teamMembers, salesCoins } = useAppState();
  const personalPercent = Math.round((currentUser.fact / currentUser.plan) * 100);
  const remaining = currentUser.plan - currentUser.fact;
  const nextReward = 110;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'} text-white`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} />
            <span className="text-sm font-medium opacity-90">Добро пожаловать!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">Привет, {currentUser.name}! 💖</h2>
          <p className="opacity-90 text-sm sm:text-base">Сегодня отличный день для новых побед!</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-xs opacity-80">Уровень</div>
              <div className="font-bold text-lg">{currentUser.level} 🌟</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-xs opacity-80">Серия</div>
              <div className="font-bold text-lg">{currentUser.streak} 🔥</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-xs opacity-80">Значки</div>
              <div className="font-bold text-lg">{currentUser.achievements.length} 🏅</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Department Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">План отдела</h3>
                <p className="text-xs opacity-60">{departmentPlan.employees} сотрудников</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {departmentPlan.percentage}%
              </div>
            </div>
          </div>
          <ProgressBar percentage={departmentPlan.percentage} color="from-blue-400 to-purple-400" />
          <div className="flex justify-between mt-3 text-xs opacity-60">
            <span>{(departmentPlan.current / 1000000).toFixed(2)}M ₽</span>
            <span>{(departmentPlan.total / 1000000).toFixed(1)}M ₽</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-green-500 font-medium">+{(departmentPlan.percentage - departmentPlan.lastMonth).toFixed(1)}%</span>
            <span className="opacity-60">к прошлому месяцу</span>
          </div>
        </motion.div>

        {/* Personal Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Мой план</h3>
                <p className="text-xs opacity-60">Июнь 2024</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${personalPercent >= 110 ? 'text-green-500' : personalPercent >= 100 ? 'text-blue-500' : 'text-orange-500'}`}>
                {personalPercent}%
              </div>
            </div>
          </div>
          <ProgressBar percentage={Math.min(personalPercent, 100)} color={personalPercent >= 110 ? 'from-green-400 to-emerald-400' : personalPercent >= 100 ? 'from-blue-400 to-cyan-400' : 'from-orange-400 to-pink-400'} />
          <div className="flex justify-between mt-3 text-xs opacity-60">
            <span>{(currentUser.fact / 1000).toFixed(0)}K ₽</span>
            <span>{(currentUser.plan / 1000).toFixed(0)}K ₽</span>
          </div>
          {remaining > 0 && (
            <div className="mt-2 text-xs">
              <span className="opacity-60">Осталось: </span>
              <span className="font-bold text-pink-500">{(remaining / 1000).toFixed(0)}K ₽</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard emoji="🎯" label="До награды" value={`${Math.max(0, nextReward - personalPercent)}%`} color="from-pink-100 to-rose-100" darkColor="from-pink-900/30 to-rose-900/30" darkMode={darkMode} />
        <StatCard emoji="⭐" label="Значков" value={`${currentUser.achievements.length}`} color="from-amber-100 to-yellow-100" darkColor="from-amber-900/30 to-yellow-900/30" darkMode={darkMode} />
        <StatCard emoji="🪙" label="Монет" value={salesCoins.toLocaleString()} color="from-blue-100 to-cyan-100" darkColor="from-blue-900/30 to-cyan-900/30" darkMode={darkMode} />
        <StatCard emoji="📊" label="Место" value={`#${teamMembers.sort((a, b) => (b.fact / b.plan) - (a.fact / a.plan)).findIndex(m => m.id === currentUser.id) + 1}`} color="from-purple-100 to-violet-100" darkColor="from-purple-900/30 to-violet-900/30" darkMode={darkMode} />
      </div>

      {/* Next Achievements */}
      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-amber-500">⭐</span>
          Ближайшие достижения
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { emoji: '🏆', name: 'План? Какой план?', desc: 'Выполни план на 110%', progress: personalPercent, target: 110, rarity: 'epic' as const },
            { emoji: '🔥', name: 'Не остановить', desc: '3 месяца подряд', progress: 2, target: 3, rarity: 'rare' as const },
            { emoji: '📈', name: 'Ракета месяца', desc: 'Рост > 20% к прошлому', progress: 15, target: 20, rarity: 'epic' as const },
          ].map((ach, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].border} transition-all`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ach.emoji}</span>
                <div>
                  <div className="font-bold text-sm">{ach.name}</div>
                  <div className="text-xs opacity-60">{ach.desc}</div>
                </div>
              </div>
              <ProgressBar percentage={(ach.progress / ach.target) * 100} color="from-pink-400 to-purple-400" small />
              <div className="text-xs mt-1 opacity-60">{ach.progress}/{ach.target}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Badges & Top Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-purple-500">🏅</span>
            Последние значки
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {currentUser.achievements.slice(-4).reverse().map((ach) => (
              <motion.div
                key={ach.id}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`aspect-square rounded-xl ${rarityColors[ach.rarity].bg} border ${rarityColors[ach.rarity].border} flex flex-col items-center justify-center p-2 cursor-pointer`}
              >
                <span className="text-2xl sm:text-3xl">{ach.emoji}</span>
                <span className="text-[9px] sm:text-[10px] font-medium text-center mt-1 leading-tight">{ach.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-amber-500">👑</span>
            ТОП месяца
          </h3>
          <div className="space-y-3">
            {[...teamMembers]
              .sort((a, b) => (b.fact / b.plan) - (a.fact / a.plan))
              .slice(0, 3)
              .map((emp, i) => (
                <div key={emp.id} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? (darkMode ? 'bg-amber-900/20' : 'bg-gradient-to-r from-amber-50 to-yellow-50') : ''}`}>
                  <span className="text-lg font-bold w-6">{['🥇', '🥈', '🥉'][i]}</span>
                  <span className="text-xl">{emp.avatar}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{emp.name}</div>
                    <div className="text-xs opacity-60">Ур. {emp.level} • {emp.achievements.length} значков</div>
                  </div>
                  <div className="font-bold text-sm">
                    {Math.round((emp.fact / emp.plan) * 100)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-blue-500">📊</span>
          Моя динамика
        </h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentUser.monthlyHistory}>
              <defs>
                <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="percentage" stroke="#ec4899" strokeWidth={3} fill="url(#colorPercent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ==================== ACHIEVEMENTS VIEW ====================
function AchievementsView({ darkMode }: { darkMode: boolean }) {
  const { currentUser } = useAppState();

  const allAchievements = [
    { emoji: '🏆', name: 'План? Какой план? Я уже впереди!', desc: 'Выполнение плана более 110%', rarity: 'epic' as const, obtained: currentUser.achievements.some(a => a.name.includes('План?')), date: '20 Фев 2024' },
    { emoji: '🎉', name: 'Королева акций', desc: 'Продажи по акции месяца', rarity: 'rare' as const, obtained: currentUser.achievements.some(a => a.name === 'Королева акций'), date: '15 Мар 2024' },
    { emoji: '♻️', name: 'Алмаз среди скидок', desc: 'Продажи склада брака и уценки', rarity: 'rare' as const, obtained: currentUser.achievements.some(a => a.name === 'Алмаз среди скидок'), date: '10 Май 2024' },
    { emoji: '⭐', name: 'Амбассадор бренда', desc: 'Продажи выбранного бренда', rarity: 'uncommon' as const, obtained: false },
    { emoji: '🌸', name: 'На волне успеха', desc: '2 месяца подряд', rarity: 'uncommon' as const, obtained: currentUser.achievements.some(a => a.name === 'На волне успеха'), date: '1 Мар 2024' },
    { emoji: '🔥', name: 'Не остановить', desc: '3 месяца подряд', rarity: 'rare' as const, obtained: false },
    { emoji: '👑', name: 'Живая легенда', desc: '6 месяцев подряд', rarity: 'epic' as const, obtained: false },
    { emoji: '💎', name: 'Продажная богиня', desc: '12 месяцев подряд', rarity: 'legendary' as const, obtained: false },
    { emoji: '🥇', name: 'Звезда отдела', desc: 'Лучший результат месяца', rarity: 'legendary' as const, obtained: currentUser.achievements.some(a => a.name === 'Звезда отдела'), date: '30 Апр 2024' },
    { emoji: '👑', name: 'Императрица продаж', desc: 'Лучший результат квартала', rarity: 'legendary' as const, obtained: false },
    { emoji: '✨', name: 'Легенда компании', desc: 'Лучший результат года', rarity: 'legendary' as const, obtained: false },
    { emoji: '🐣', name: 'Первый полет', desc: 'Первый выполненный план', rarity: 'common' as const, obtained: currentUser.achievements.some(a => a.name === 'Первый полет'), date: '15 Янв 2024' },
    { emoji: '🚀', name: 'Теперь меня не остановить', desc: 'Первый перевыполненный план', rarity: 'uncommon' as const, obtained: false },
    { emoji: '⏰', name: 'Мисс Пунктуальность', desc: 'Без просроченных дней', rarity: 'epic' as const, obtained: currentUser.achievements.some(a => a.name === 'Мисс Пунктуальность'), date: '1 Апр 2024' },
    { emoji: '📈', name: 'Ракета месяца', desc: 'Самый большой рост', rarity: 'epic' as const, obtained: false },
  ];

  const obtained = allAchievements.filter(a => a.obtained);
  const locked = allAchievements.filter(a => !a.obtained);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-amber-500">🏆</span>
          Коллекция достижений
        </h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-pink-100'}`}>
          {obtained.length}/{allAchievements.length} 🏅
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map(rarity => {
          const count = obtained.filter(a => a.rarity === rarity).length;
          const total = allAchievements.filter(a => a.rarity === rarity).length;
          return (
            <div key={rarity} className={`px-3 py-1.5 rounded-full text-xs font-medium ${rarityColors[rarity].bg} ${rarityColors[rarity].border} border`}>
              {rarityColors[rarity].label} {count}/{total}
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <span className="text-pink-500">✨</span>
          Полученные ({obtained.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {obtained.map((ach, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className={`p-4 rounded-2xl border-2 ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].border} cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{ach.emoji}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].text} font-bold`}>
                    {rarityColors[ach.rarity].label}
                  </span>
                </div>
                <h4 className="font-bold text-sm mt-2">{ach.name}</h4>
                <p className="text-xs opacity-60 mt-1">{ach.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs opacity-50">📅 {ach.date}</span>
                  <button className="text-xs text-pink-500 font-medium">Поделиться ↗</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Lock size={18} className="text-gray-400" />
          В процессе ({locked.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locked.map((ach, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} opacity-60 cursor-pointer transition-all`}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl grayscale">{ach.emoji}</span>
                <Lock size={16} className="text-gray-400" />
              </div>
              <h4 className="font-bold text-sm mt-2">{ach.name}</h4>
              <p className="text-xs opacity-60 mt-1">{ach.desc}</p>
              <span className={`text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].text} font-medium`}>
                {rarityColors[ach.rarity].label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== SHOP VIEW ====================
function ShopView({ darkMode, onSpend }: { darkMode: boolean; onSpend: (amount: number, name: string) => void }) {
  const { prizes, salesCoins } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const categories = ['Все', ...new Set(prizes.map(p => p.category))];
  const filtered = selectedCategory === 'Все' ? prizes : prizes.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-pink-500">🎁</span>
          Витрина наград
        </h2>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-gradient-to-r from-yellow-100 to-amber-100'}`}>
          <span>🪙</span>
          <span className="font-bold text-amber-600">{salesCoins} Sales Coins</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prize, i) => (
          <motion.div
            key={prize.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm hover:shadow-lg transition-all`}
          >
            <div className="text-4xl mb-3">{prize.emoji}</div>
            <h3 className="font-bold">{prize.name}</h3>
            <p className="text-sm opacity-60 mt-1">{prize.description}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1">
                <span>🪙</span>
                <span className="font-bold text-amber-600">{prize.cost}</span>
              </div>
              <button
                onClick={() => onSpend(prize.cost, prize.name)}
                disabled={salesCoins < prize.cost}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  salesCoins >= prize.cost
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {salesCoins >= prize.cost ? 'Обменять' : 'Мало монет'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== LEADERBOARD VIEW ====================
function LeaderboardView({ darkMode }: { darkMode: boolean }) {
  const { teamMembers, currentUser } = useAppState();
  const sorted = [...teamMembers].sort((a, b) => (b.fact / b.plan) - (a.fact / a.plan));

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-amber-500">🏅</span>
        Таблица лидеров
      </h2>

      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-3 sm:gap-6 py-6">
          {[sorted[1], sorted[0], sorted[2]].map((emp, i) => {
            const positions = [1, 0, 2];
            const heights = ['h-24', 'h-32', 'h-20'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: positions[i] * 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="text-3xl sm:text-4xl mb-2">{emp.avatar}</div>
                <span className="text-lg">{medals[i]}</span>
                <div className="font-bold text-sm mt-1">{emp.name}</div>
                <div className="text-xs opacity-60">{Math.round((emp.fact / emp.plan) * 100)}%</div>
                <div className={`${heights[i]} w-20 sm:w-24 mt-2 rounded-t-xl bg-gradient-to-t ${i === 1 ? 'from-amber-400 to-yellow-300' : i === 0 ? 'from-gray-300 to-gray-200' : 'from-orange-300 to-amber-200'} flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white/80">{positions[i] + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        {sorted.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 sm:gap-4 p-4 ${i !== sorted.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}` : ''} ${emp.id === currentUser.id ? (darkMode ? 'bg-pink-900/20' : 'bg-pink-50') : ''}`}
          >
            <span className="w-8 text-center font-bold text-lg">
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
            </span>
            <span className="text-2xl">{emp.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{emp.name} {emp.id === currentUser.id && <span className="text-pink-500 text-xs">(Вы)</span>}</div>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <span>Ур. {emp.level}</span>
                <span>•</span>
                <span>{emp.achievements.length} значков</span>
                <span>•</span>
                <span>🔥 {emp.streak}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm">{Math.round((emp.fact / emp.plan) * 100)}%</div>
              <div className="text-xs opacity-60">{(emp.fact / 1000).toFixed(0)}K ₽</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== ANALYTICS VIEW ====================
function AnalyticsView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { currentUser, teamMembers, departmentPlan } = useAppState();
  const chartData = currentUser.monthlyHistory;
  const teamData = teamMembers.map(m => ({ name: m.name.split(' ')[0], percent: Math.round((m.fact / m.plan) * 100) }));

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-blue-500">📊</span>
        Аналитика
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold">{departmentPlan.percentage}%</div>
          <div className="text-xs opacity-60">Выполнение отдела</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold">{teamMembers.filter(m => (m.fact / m.plan) >= 1).length}/{teamMembers.length}</div>
          <div className="text-xs opacity-60">Выполнили план</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">🌟</div>
          <div className="text-2xl font-bold">{teamMembers.filter(m => (m.fact / m.plan) >= 1.1).length}</div>
          <div className="text-xs opacity-60">Перевыполнили</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-bold">{teamMembers.reduce((sum, m) => sum + m.streak, 0)}</div>
          <div className="text-xs opacity-60">Общая серия дней</div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4">Выполнение по сотрудникам</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="percent" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4">Динамика по месяцам</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="percentage" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-orange-500">🎯</span>
          Почти у цели (нужно немного!)
        </h3>
        <div className="space-y-3">
          {teamMembers
            .filter(m => {
              const pct = (m.fact / m.plan) * 100;
              return pct >= 80 && pct < 100;
            })
            .map(emp => (
              <div key={emp.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
                <span className="text-xl">{emp.avatar}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{emp.name}</div>
                  <div className="text-xs opacity-60">Осталось {((emp.plan - emp.fact) / 1000).toFixed(0)}K ₽</div>
                </div>
                <div className="font-bold text-orange-500">{Math.round((emp.fact / emp.plan) * 100)}%</div>
              </div>
            ))}
          {teamMembers.filter(m => { const pct = (m.fact / m.plan) * 100; return pct >= 80 && pct < 100; }).length === 0 && (
            <p className="text-sm opacity-60 text-center py-4">Нет сотрудников в этой категории 🎉</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => showToast('📊 Отчёт Excel скачан!')} className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          📊 Экспорт в Excel
        </button>
        <button onClick={() => showToast('📄 PDF отчёт сформирован!')} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          📄 Экспорт в PDF
        </button>
        <button onClick={() => showToast('📥 Откройте файл для импорта')} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          📥 Импорт из CSV
        </button>
      </div>
    </div>
  );
}

// ==================== PROFILE VIEW ====================
function ProfileView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { currentUser } = useAppState();
  const personalPercent = Math.round((currentUser.fact / currentUser.plan) * 100);
  const xpPercent = (currentUser.xp / currentUser.xpToNext) * 100;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400'} text-white relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl border-4 border-white/30">
            {currentUser.avatar}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            <p className="opacity-80">{currentUser.department}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold">⭐ Уровень {currentUser.level}</span>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold">🔥 {currentUser.streak} дней</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-sm mb-1">
            <span>Опыт: {currentUser.xp} XP</span>
            <span>{currentUser.xpToNext - currentUser.xp} XP до уровня {currentUser.level + 1}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl font-bold text-pink-500">{personalPercent}%</div>
          <div className="text-xs opacity-60 mt-1">План месяца</div>
        </div>
        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl font-bold text-purple-500">{currentUser.achievements.length}</div>
          <div className="text-xs opacity-60 mt-1">Достижений</div>
        </div>
        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl font-bold text-amber-500">1,250</div>
          <div className="text-xs opacity-60 mt-1">Sales Coins</div>
        </div>
        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl font-bold text-blue-500">#3</div>
          <div className="text-xs opacity-60 mt-1">В рейтинге</div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-blue-500">📅</span>
          Календарь активности
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => {
            const intensity = Math.random();
            const active = i < 25;
            return (
              <div
                key={i}
                className={`aspect-square rounded-md ${
                  !active ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') :
                  intensity > 0.7 ? 'bg-gradient-to-br from-pink-400 to-purple-400' :
                  intensity > 0.4 ? 'bg-pink-200' :
                  'bg-pink-100'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs opacity-60">
          <span>Меньше</span>
          <div className="w-3 h-3 rounded bg-pink-100" />
          <div className="w-3 h-3 rounded bg-pink-200" />
          <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-400 to-purple-400" />
          <span>Больше</span>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-pink-500">🎁</span>
          Мои призы
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: '☕', name: 'Кофе на месяц', status: 'Получен', date: 'Март 2024' },
            { emoji: '🎬', name: 'Билеты в кино', status: 'Ожидает выдачи', date: 'Май 2024' },
          ].map((prize, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-pink-50'}`}>
              <span className="text-2xl">{prize.emoji}</span>
              <div>
                <div className="font-medium text-sm">{prize.name}</div>
                <div className="text-xs opacity-60">{prize.status} • {prize.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== CHALLENGES VIEW ====================
function ChallengesView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { challenges, updateChallenge } = useAppState();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'seasonal'>('daily');
  const filtered = challenges.filter(c => c.type === activeTab);

  const handleProgress = (id: string, current: number, total: number) => {
    if (current < total) {
      updateChallenge(id, { progress: current + 1 });
      if (current + 1 >= total) {
        showToast('🎉 Челлендж выполнен! +XP начислены');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-yellow-500">⚡</span>
        Челленджи и задания
      </h2>

      <div className="flex gap-2">
        {[
          { key: 'daily' as const, label: 'Ежедневные', emoji: '🌅' },
          { key: 'weekly' as const, label: 'Еженедельные', emoji: '📅' },
          { key: 'seasonal' as const, label: 'Сезонные', emoji: '🌞' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-3xl shrink-0">
                {challenge.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{challenge.title}</h3>
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">+{challenge.xpReward} XP</span>
                </div>
                <p className="text-sm opacity-60 mt-1">{challenge.description}</p>
                <div className="mt-3">
                  <ProgressBar percentage={(challenge.progress / challenge.total) * 100} color="from-yellow-400 to-orange-400" />
                  <div className="flex justify-between mt-1 text-xs opacity-60">
                    <span>{challenge.progress}/{challenge.total}</span>
                    <span>⏰ {challenge.deadline}</span>
                  </div>
                </div>
                {challenge.progress < challenge.total && (
                  <button
                    onClick={() => handleProgress(challenge.id, challenge.progress, challenge.total)}
                    className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                  >
                    +1 Прогресс
                  </button>
                )}
                {challenge.progress >= challenge.total && (
                  <span className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold">
                    ✅ Выполнено!
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`rounded-2xl p-5 text-center ${darkMode ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
        <div className="text-4xl mb-2">💪</div>
        <p className="font-bold">Ты можешь больше, чем думаешь!</p>
        <p className="text-sm opacity-60 mt-1">Выполняй челленджи и зарабатывай бонусные монеты</p>
      </div>
    </div>
  );
}

// ==================== BATTLE PASS VIEW ====================
function BattlePassView({ darkMode }: { darkMode: boolean }) {
  const { battlePass } = useAppState();
  const bp = battlePass;
  const progress = (bp.level / bp.maxLevel) * 100;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className={`rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400'} text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{bp.emoji}</span>
            <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Боевой пропуск</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">{bp.name}</h2>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Уровень {bp.level}/{bp.maxLevel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5 }}
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4">Награды сезона</h3>
        <div className="space-y-3">
          {bp.rewards.map((reward, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                reward.current ? 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 border-2 border-pink-300 dark:border-pink-700 shadow-md' :
                reward.claimed ? (darkMode ? 'bg-gray-700/50' : 'bg-green-50') :
                (darkMode ? 'bg-gray-700/30 opacity-50' : 'bg-gray-50 opacity-60')
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                reward.claimed ? 'bg-green-400 text-white' :
                reward.current ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' :
                (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-400')
              }`}>
                {reward.claimed ? <Check size={18} /> : reward.current ? <Star size={18} /> : reward.level}
              </div>
              <span className="text-2xl">{reward.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{reward.reward}</div>
                <div className="text-xs opacity-60">Уровень {reward.level}</div>
              </div>
              {reward.current && (
                <span className="text-xs font-bold text-pink-500 bg-pink-100 dark:bg-pink-900/50 px-2 py-1 rounded-full">Текущий</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== NOTIFICATIONS VIEW ====================
function NotificationsView({ darkMode, onMarkRead, onMarkAllRead }: { darkMode: boolean; onMarkRead: (id: string) => void; onMarkAllRead: () => void }) {
  const { notifications } = useAppState();

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-pink-500">🔔</span>
          Уведомления
        </h2>
        <button onClick={onMarkAllRead} className="text-sm text-pink-500 font-medium hover:underline">
          Прочитать все
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onMarkRead(notif.id)}
            className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
              !notif.read
                ? (darkMode ? 'bg-pink-900/20 border border-pink-800' : 'bg-pink-50 border border-pink-200')
                : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100')
            }`}
          >
            <span className="text-2xl">{notif.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">{notif.title}</h4>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-pink-500" />}
              </div>
              <p className="text-sm opacity-60 mt-0.5">{notif.message}</p>
              <span className="text-xs opacity-40 mt-1">{notif.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== TEAM VIEW (Manager) ====================
function TeamView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { teamMembers, departmentPlan, updateDepartmentPlan, updateTeamMember, removeTeamMember, addTeamMember } = useAppState();

  const [editingPlan, setEditingPlan] = useState(false);
  const [planTotal, setPlanTotal] = useState(departmentPlan.total);
  const [planBrand, setPlanBrand] = useState(departmentPlan.brandOfMonth);
  const [planPromo, setPlanPromo] = useState(departmentPlan.promoOfMonth);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPlan, setNewMemberPlan] = useState(500000);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editMemberPlan, setEditMemberPlan] = useState(0);
  const [editMemberFact, setEditMemberFact] = useState(0);

  const handleSavePlan = () => {
    updateDepartmentPlan({ total: planTotal, brandOfMonth: planBrand, promoOfMonth: planPromo });
    setEditingPlan(false);
    showToast('✅ План отдела обновлён!');
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const avatars = ['👩‍💼', '👩‍🦰', '👩‍🦱', '💁‍♀️', '🧕', '👱‍♀️', '👩', '🧑‍💼'];
    const newMember: any = {
      id: Date.now().toString(),
      name: newMemberName,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      role: 'employee' as const,
      department: 'Отдел продаж №1',
      level: 1,
      xp: 0,
      xpToNext: 1000,
      streak: 0,
      plan: newMemberPlan,
      fact: 0,
      achievements: [],
      monthlyHistory: [],
    };
    addTeamMember(newMember);
    setNewMemberName('');
    setShowAddMember(false);
    showToast(`✅ ${newMemberName} добавлен в команду!`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    removeTeamMember(id);
    showToast(`🗑️ ${name} удалён из команды`);
  };

  const handleSaveMemberPlan = (id: string) => {
    updateTeamMember(id, { plan: editMemberPlan, fact: editMemberFact });
    setEditingMember(null);
    showToast('✅ Данные сотрудника обновлены!');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-purple-500">👥</span>
          Управление командой
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-1"
          >
            <Plus size={16} /> Пригласить
          </button>
          <button onClick={() => showToast('📥 Откройте файл Excel для импорта')} className={`px-4 py-2 rounded-xl text-sm font-bold ${darkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
            📥 Импорт Excel
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddMember(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            >
              <h3 className="text-xl font-bold mb-4">Добавить сотрудника</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium opacity-70">Имя сотрудника</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="Введите имя..."
                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium opacity-70">Личный план (₽)</label>
                  <input
                    type="number"
                    value={newMemberPlan}
                    onChange={e => setNewMemberPlan(Number(e.target.value))}
                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddMember(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddMember}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Department Plan Settings */}
      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">📋 План отдела на июнь</h3>
          {!editingPlan ? (
            <button
              onClick={() => setEditingPlan(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Edit3 size={14} /> Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingPlan(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                Отмена
              </button>
              <button onClick={handleSavePlan} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                <Save size={14} /> Сохранить
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs opacity-60 font-medium">Общий план (₽)</label>
            <input
              type="number"
              value={editingPlan ? planTotal : departmentPlan.total}
              onChange={e => setPlanTotal(Number(e.target.value))}
              disabled={!editingPlan}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 ${!editingPlan ? 'opacity-70' : ''}`}
            />
          </div>
          <div>
            <label className="text-xs opacity-60 font-medium">Бренд месяца</label>
            <input
              type="text"
              value={editingPlan ? planBrand : departmentPlan.brandOfMonth}
              onChange={e => setPlanBrand(e.target.value)}
              disabled={!editingPlan}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 ${!editingPlan ? 'opacity-70' : ''}`}
            />
          </div>
          <div>
            <label className="text-xs opacity-60 font-medium">Акция месяца</label>
            <input
              type="text"
              value={editingPlan ? planPromo : departmentPlan.promoOfMonth}
              onChange={e => setPlanPromo(e.target.value)}
              disabled={!editingPlan}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 ${!editingPlan ? 'opacity-70' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-bold">Сотрудники ({teamMembers.length})</h3>
        </div>
        {teamMembers.map((emp, i) => (
          <div key={emp.id} className={`p-4 ${i !== teamMembers.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}` : ''}`}>
            {editingMember === emp.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emp.avatar}</span>
                  <span className="font-bold">{emp.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs opacity-60">План (₽)</label>
                    <input
                      type="number"
                      value={editMemberPlan}
                      onChange={e => setEditMemberPlan(Number(e.target.value))}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm`}
                    />
                  </div>
                  <div>
                    <label className="text-xs opacity-60">Факт (₽)</label>
                    <input
                      type="number"
                      value={editMemberFact}
                      onChange={e => setEditMemberFact(Number(e.target.value))}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingMember(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    Отмена
                  </button>
                  <button onClick={() => handleSaveMemberPlan(emp.id)} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                    <Save size={12} /> Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emp.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{emp.name}</div>
                  <div className="text-xs opacity-60">Ур. {emp.level} • План: {(emp.plan / 1000).toFixed(0)}K ₽ • Факт: {(emp.fact / 1000).toFixed(0)}K ₽</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-sm">{Math.round((emp.fact / emp.plan) * 100)}%</div>
                  <div className="text-xs opacity-60">{emp.achievements.length} значков</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingMember(emp.id); setEditMemberPlan(emp.plan); setEditMemberFact(emp.fact); }}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'} text-blue-500`}
                    title="Редактировать план"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(emp.id, emp.name)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'} text-red-500`}
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SETTINGS VIEW ====================
function SettingsView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { companySettings, updateCompanySettings } = useAppState();

  const [localName, setLocalName] = useState(companySettings.name);
  const [localColor, setLocalColor] = useState(companySettings.mainColor);
  const [localApiKey, setLocalApiKey] = useState(companySettings.apiKey);

  const handleSaveCompany = () => {
    updateCompanySettings({ name: localName, mainColor: localColor, apiKey: localApiKey });
    showToast('✅ Настройки компании сохранены!');
  };

  const colors = [
    { value: 'bg-pink-500', label: 'Розовый' },
    { value: 'bg-purple-500', label: 'Фиолетовый' },
    { value: 'bg-blue-500', label: 'Синий' },
    { value: 'bg-green-500', label: 'Зелёный' },
    { value: 'bg-amber-500', label: 'Золотой' },
    { value: 'bg-red-500', label: 'Красный' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-gray-500">⚙️</span>
        Настройки
      </h2>

      <div className="space-y-4">
        {/* Company Branding */}
        <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">🏢 Брендирование компании</h3>
            <button
              onClick={handleSaveCompany}
              className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Save size={14} /> Сохранить
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium opacity-70">Название компании</label>
              <input
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
              />
            </div>
            <div>
              <label className="text-sm font-medium opacity-70">Основной цвет</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setLocalColor(color.value)}
                    className={`w-10 h-10 rounded-full ${color.value} ring-2 ring-offset-2 transition-all ${localColor === color.value ? 'ring-pink-400 scale-110' : 'ring-transparent hover:ring-pink-200'} ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold mb-4">🔔 Уведомления и эффекты</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Звуки уведомлений</span>
                <p className="text-xs opacity-50">Звуковые эффекты при событиях</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={companySettings.soundsEnabled}
                  onChange={e => { updateCompanySettings({ soundsEnabled: e.target.checked }); showToast(e.target.checked ? '🔊 Звуки включены' : '🔇 Звуки выключены'); }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Push-уведомления</span>
                <p className="text-xs opacity-50">Уведомления в браузере</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={companySettings.pushEnabled}
                  onChange={e => { updateCompanySettings({ pushEnabled: e.target.checked }); showToast(e.target.checked ? '📬 Push включены' : '📭 Push выключены'); }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Анимация конфетти</span>
                <p className="text-xs opacity-50">Конфетти при достижениях</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={companySettings.confettiEnabled}
                  onChange={e => { updateCompanySettings({ confettiEnabled: e.target.checked }); showToast(e.target.checked ? '🎊 Конфетти включено' : 'Конфетти выключено'); }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold mb-4">🔗 Интеграции</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <span className="text-sm font-medium">CRM интеграция</span>
                  <p className="text-xs opacity-50">Автоматический импорт данных</p>
                </div>
              </div>
              <button
                onClick={() => {
                  updateCompanySettings({ crmConnected: !companySettings.crmConnected });
                  showToast(companySettings.crmConnected ? '❌ CRM отключена' : '✅ CRM подключена!');
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-full ${companySettings.crmConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}
              >
                {companySettings.crmConnected ? '✓ Подключено' : 'Отключено'}
              </button>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  <span className="text-sm font-medium">API ключ</span>
                </div>
                <button
                  onClick={() => { updateCompanySettings({ apiKey: localApiKey }); showToast('✅ API ключ сохранён!'); }}
                  className="text-xs text-pink-500 font-medium"
                >
                  Сохранить
                </button>
              </div>
              <input
                type="text"
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================
function ProgressBar({ percentage, color, small }: { percentage: number; color: string; small?: boolean }) {
  return (
    <div className={`w-full ${small ? 'h-2' : 'h-3'} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${color} rounded-full relative`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
      </motion.div>
    </div>
  );
}

function StatCard({ emoji, label, value, color, darkColor, darkMode }: { emoji: string; label: string; value: string; color: string; darkColor: string; darkMode: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${darkMode ? darkColor : color} border ${darkMode ? 'border-gray-700' : 'border-white/50'} shadow-sm`}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </motion.div>
  );
}

export default App;
