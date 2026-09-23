import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { AppProvider, useAppState, CREATOR_EMAIL, type User, type UserAchievement, type AchievementTemplate, type Challenge } from './store/AppContext';
import { rarityColors } from './data/mockData';
import {
  Home, Trophy, Gift, BarChart3, Users, Bell, Settings, Moon, Sun,
  Target, TrendingUp, Crown, Sparkles, Star,
  Medal, Award, Zap, DollarSign,
  Menu, X, Check, Lock, Trash2, Edit3, Plus, Save, LogOut, Shield, Image as ImageIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

type View = 'home' | 'achievements' | 'shop' | 'leaderboard' | 'analytics' | 'profile' | 'challenges' | 'notifications' | 'team' | 'settings';

// ============ COLOR MAP ============
const COLOR_MAP: Record<string, { gradient: string; light: string; hex: string }> = {
  pink: { gradient: 'from-pink-400 via-purple-400 to-blue-400', light: 'from-pink-50 via-purple-50 to-blue-50', hex: '#ec4899' },
  purple: { gradient: 'from-purple-400 via-indigo-400 to-pink-400', light: 'from-purple-50 via-indigo-50 to-pink-50', hex: '#8b5cf6' },
  blue: { gradient: 'from-blue-400 via-cyan-400 to-purple-400', light: 'from-blue-50 via-cyan-50 to-purple-50', hex: '#3b82f6' },
  green: { gradient: 'from-green-400 via-emerald-400 to-teal-400', light: 'from-green-50 via-emerald-50 to-teal-50', hex: '#22c55e' },
  amber: { gradient: 'from-amber-400 via-orange-400 to-yellow-400', light: 'from-amber-50 via-orange-50 to-yellow-50', hex: '#f59e0b' },
  red: { gradient: 'from-red-400 via-rose-400 to-pink-400', light: 'from-red-50 via-rose-50 to-pink-50', hex: '#ef4444' },
  cyan: { gradient: 'from-cyan-400 via-blue-400 to-indigo-400', light: 'from-cyan-50 via-blue-50 to-indigo-50', hex: '#06b6d4' },
  rose: { gradient: 'from-rose-400 via-pink-400 to-fuchsia-400', light: 'from-rose-50 via-pink-50 to-fuchsia-50', hex: '#f43f5e' },
  teal: { gradient: 'from-teal-400 via-green-400 to-emerald-400', light: 'from-teal-50 via-green-50 to-emerald-50', hex: '#14b8a6' },
  indigo: { gradient: 'from-indigo-400 via-purple-400 to-pink-400', light: 'from-indigo-50 via-purple-50 to-pink-50', hex: '#6366f1' },
  orange: { gradient: 'from-orange-400 via-amber-400 to-yellow-400', light: 'from-orange-50 via-amber-50 to-yellow-50', hex: '#f97316' },
  lime: { gradient: 'from-lime-400 via-green-400 to-teal-400', light: 'from-lime-50 via-green-50 to-teal-50', hex: '#84cc16' },
  sky: { gradient: 'from-sky-400 via-blue-400 to-indigo-400', light: 'from-sky-50 via-blue-50 to-indigo-50', hex: '#0ea5e9' },
  violet: { gradient: 'from-violet-400 via-fuchsia-400 to-pink-400', light: 'from-violet-50 via-fuchsia-50 to-pink-50', hex: '#8b5cf6' },
  slate: { gradient: 'from-slate-400 via-gray-400 to-zinc-400', light: 'from-slate-50 via-gray-50 to-zinc-50', hex: '#64748b' },
  emerald: { gradient: 'from-emerald-400 via-green-400 to-cyan-400', light: 'from-emerald-50 via-green-50 to-cyan-50', hex: '#10b981' },
};

// ============ TOAST ============
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-medium text-sm">
        <Check size={18} />{message}
      </div>
    </motion.div>
  );
}

// ============ AUTH SCREEN ============
function AuthScreen({ darkMode }: { darkMode: boolean }) {
  const { login, register, companySettings } = useAppState();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const color = COLOR_MAP[companySettings.mainColor] || COLOR_MAP.pink;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      const result = login(email, password);
      if (!result.success) setError(result.error || 'Ошибка входа');
    } else {
      const result = register(email, password, name);
      if (result.success) {
        // После успешной регистрации сразу показываем главную страницу
        // currentUser будет установлен в AppContext, и AuthScreen перерендерится
      } else {
        setError(result.error || 'Ошибка регистрации');
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${color.light} dark:from-gray-900 dark:via-gray-900 dark:to-gray-800`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💎</div>
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}>
            {companySettings.name}
          </h1>
          <p className="text-sm opacity-60 mt-1">Геймификация отдела продаж</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-medium opacity-70">Имя</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ваше имя"
                className={`w-full mt-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium opacity-70">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className={`w-full mt-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
            />
          </div>
          <div>
            <label className="text-sm font-medium opacity-70">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              className={`w-full mt-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            className={`w-full py-3 bg-gradient-to-r ${color.gradient} text-white rounded-xl font-bold hover:shadow-lg transition-all`}
          >
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-pink-500 font-medium hover:underline"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============ MAIN APP CONTENT ============
function AppContent() {
  const {
    currentUser, users, isAuthenticated, isAdmin, logout,
    prizes, challenges, notifications, departmentPlan, companySettings, achievementTemplates,
    updateCurrentUser, updateUser, removeUser, promoteToAdmin, demoteFromAdmin,
    addPrize, updatePrize, removePrize,
    updateChallengeProgress, claimChallengeReward,
    markNotificationRead, markAllNotificationsRead,
    updateDepartmentPlan, updateCompanySettings, spendCoins,
    addAchievementTemplate, updateAchievementTemplate, removeAchievementTemplate, grantAchievementToUser,
  } = useAppState();

  const [currentView, setCurrentView] = useState<View>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState<UserAchievement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Admin: Manage achievements tab
  const [manageAchievementsTab, setManageAchievementsTab] = useState<'list' | 'create'>('list');
  const [newAchievementName, setNewAchievementName] = useState('');
  const [newAchievementDesc, setNewAchievementDesc] = useState('');
  const [newAchievementEmoji, setNewAchievementEmoji] = useState('🏆');
  const [newAchievementRarity, setNewAchievementRarity] = useState<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>('common');
  const [newAchievementCost, setNewAchievementCost] = useState(50);
  const [newAchievementImage, setNewAchievementImage] = useState('');

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const color = COLOR_MAP[companySettings.mainColor] || COLOR_MAP.pink;
  const admin = isAdmin();

  // Show confetti only when receiving an admin-granted achievement (handled in grantAchievementToUser)
  // No automatic confetti on page load

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!isAuthenticated || !currentUser) {
    return <AuthScreen darkMode={darkMode} />;
  }

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;
  const employees = users.filter(u => u.role !== 'creator');

  const themeClass = darkMode ? 'dark' : '';

  return (
    <div className={`${themeClass} min-h-screen font-['Nunito',sans-serif]`}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : `bg-gradient-to-br ${color.light} text-gray-800`}`}>
        {showConfetti && <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#ff69b4', '#ffd700', '#87ceeb', '#98fb98', '#dda0dd']} />}

        {/* Achievement Popup */}
        <AnimatePresence>
          {showAchievementPopup && (
            <motion.div initial={{ opacity: 0, y: -100, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -100, scale: 0.5 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
              <div className={`relative p-6 rounded-3xl shadow-2xl border-2 ${rarityColors[showAchievementPopup.rarity].bg} ${rarityColors[showAchievementPopup.rarity].border}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-4 py-1 rounded-full font-bold">
                  ✨ ДОСТИЖЕНИЕ ✨
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl mb-2 animate-bounce">{showAchievementPopup.emoji}</div>
                  <h3 className="font-bold text-lg">{showAchievementPopup.name}</h3>
                  <p className={`text-sm ${rarityColors[showAchievementPopup.rarity].text}`}>{rarityColors[showAchievementPopup.rarity].label}</p>
                  <p className="text-sm opacity-70 mt-1">{showAchievementPopup.description}</p>
                  <button onClick={() => setShowAchievementPopup(null)} className="mt-3 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-bold">
                    Ура! 🎉
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>

        {/* Header */}
        <header className={`sticky top-0 z-40 backdrop-blur-xl ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/70 border-white/50'} border-b`}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <h1 className={`text-xl font-bold bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent hidden sm:block`}>
                  {companySettings.name}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Role Badge */}
              <div className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-pink-100 to-purple-100'}`}>
                {admin ? '👑 Админ' : '👤 Участник'}
              </div>
              {/* Coins */}
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-gradient-to-r from-yellow-100 to-amber-100'}`}>
                <span className="text-sm">🪙</span>
                <span className="font-bold text-sm text-amber-600">{currentUser.salesCoins}</span>
              </div>
              {/* Notifications */}
              <button onClick={() => setCurrentView('notifications')} className="relative p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-800 transition-all">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
              </button>
              {/* Theme */}
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-800 transition-all">
                {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
              </button>
              {/* Profile */}
              <button onClick={() => setCurrentView('profile')} className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-lg shadow-md overflow-hidden">
                {currentUser.avatar.startsWith('data:image') ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.avatar
                )}
              </button>
              {/* Logout */}
              <button onClick={logout} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all" title="Выйти">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 min-h-[calc(100vh-64px)] p-4 sticky top-16">
            <nav className="space-y-1">
              <SidebarItem icon={<Home size={20} />} label="Главная" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
              <SidebarItem icon={<Trophy size={20} />} label="Достижения" active={currentView === 'achievements'} onClick={() => setCurrentView('achievements')} />
              <SidebarItem icon={<Zap size={20} />} label="Челленджи" active={currentView === 'challenges'} onClick={() => setCurrentView('challenges')} />
              <SidebarItem icon={<Gift size={20} />} label="Магазин наград" active={currentView === 'shop'} onClick={() => setCurrentView('shop')} />
              <SidebarItem icon={<Medal size={20} />} label="Рейтинг" active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} />
              {admin && (
                <>
                  <SidebarItem icon={<BarChart3 size={20} />} label="Аналитика" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
                  <SidebarItem icon={<Users size={20} />} label="Команда" active={currentView === 'team'} onClick={() => setCurrentView('team')} />
                  <SidebarItem icon={<Settings size={20} />} label="Настройки" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
                  <SidebarItem icon={<Settings size={20} />} label="Профиль" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
                </>
              )}
              {!admin && (
                <SidebarItem icon={<Settings size={20} />} label="Профиль" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
              )}
            </nav>
          </aside>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
                <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`absolute left-0 top-0 bottom-0 w-72 p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl overflow-y-auto`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`font-bold text-lg bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}>{companySettings.name}</h2>
                    <button onClick={() => setShowMobileMenu(false)}><X size={24} /></button>
                  </div>
                  <nav className="space-y-1">
                    <SidebarItem icon={<Home size={20} />} label="Главная" active={currentView === 'home'} onClick={() => { setCurrentView('home'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Trophy size={20} />} label="Достижения" active={currentView === 'achievements'} onClick={() => { setCurrentView('achievements'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Zap size={20} />} label="Челленджи" active={currentView === 'challenges'} onClick={() => { setCurrentView('challenges'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Gift size={20} />} label="Магазин" active={currentView === 'shop'} onClick={() => { setCurrentView('shop'); setShowMobileMenu(false); }} />
                    <SidebarItem icon={<Medal size={20} />} label="Рейтинг" active={currentView === 'leaderboard'} onClick={() => { setCurrentView('leaderboard'); setShowMobileMenu(false); }} />
                    {admin && (
                      <>
                        <SidebarItem icon={<BarChart3 size={20} />} label="Аналитика" active={currentView === 'analytics'} onClick={() => { setCurrentView('analytics'); setShowMobileMenu(false); }} />
                        <SidebarItem icon={<Users size={20} />} label="Команда" active={currentView === 'team'} onClick={() => { setCurrentView('team'); setShowMobileMenu(false); }} />
                        <SidebarItem icon={<Settings size={20} />} label="Настройки" active={currentView === 'settings'} onClick={() => { setCurrentView('settings'); setShowMobileMenu(false); }} />
                        <SidebarItem icon={<Settings size={20} />} label="Профиль" active={currentView === 'profile'} onClick={() => { setCurrentView('profile'); setShowMobileMenu(false); }} />
                      </>
                    )}
                  </nav>
                  <button onClick={() => { logout(); setShowMobileMenu(false); }} className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut size={20} /> Выйти
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main */}
          <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-64px)]">
            <AnimatePresence mode="wait">
              <motion.div key={currentView + currentUser.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                {currentView === 'home' && <HomeView darkMode={darkMode} admin={admin} employees={employees} departmentPlan={departmentPlan} color={color} showToast={showToast} currentUser={currentUser} />}
                {currentView === 'achievements' && <AchievementsView darkMode={darkMode} isAdmin={admin} />}
                {currentView === 'shop' && <ShopView darkMode={darkMode} prizes={prizes} salesCoins={currentUser.salesCoins} onSpend={(amount, name, prize) => { spendCoins(amount, prize); setShowConfetti(true); showToast(`🎉 Вы приобрели "${name}"!`); }} />}
                {currentView === 'leaderboard' && <LeaderboardView darkMode={darkMode} employees={employees} currentUserId={currentUser.id} />}
                {currentView === 'analytics' && admin && <AnalyticsView darkMode={darkMode} employees={employees} departmentPlan={departmentPlan} showToast={showToast} />}
                {currentView === 'profile' && <ProfileView darkMode={darkMode} showToast={showToast} />}
                {currentView === 'challenges' && <ChallengesView darkMode={darkMode} challenges={challenges} updateChallengeProgress={updateChallengeProgress} claimChallengeReward={claimChallengeReward} showToast={showToast} />}
                {currentView === 'notifications' && <NotificationsView darkMode={darkMode} notifications={userNotifications} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} />}
                {currentView === 'team' && admin && <TeamView darkMode={darkMode} users={users} currentUser={currentUser} updateUser={updateUser} removeUser={removeUser} promoteToAdmin={promoteToAdmin} demoteFromAdmin={demoteFromAdmin} showToast={showToast} />}
                {currentView === 'settings' && admin && <SettingsView darkMode={darkMode} showToast={showToast} achievementTemplates={achievementTemplates} addAchievementTemplate={addAchievementTemplate} updateAchievementTemplate={updateAchievementTemplate} removeAchievementTemplate={removeAchievementTemplate} grantAchievementToUser={grantAchievementToUser} users={users} currentUser={currentUser} />}
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

// ============ SIDEBAR ITEM ============
function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25' : 'hover:bg-pink-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
      {icon}{label}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${active ? 'text-pink-500' : 'text-gray-400'}`}>
      {icon}<span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ============ HOME VIEW ============
function HomeView({ darkMode, admin, employees, departmentPlan, color, showToast, currentUser }: { darkMode: boolean; admin: boolean; employees: User[]; departmentPlan: any; color: any; showToast: (m: string) => void; currentUser: User }) {
  const { updateCurrentUser } = useAppState();
  if (!currentUser) return null;

  const personalPercent = currentUser.plan > 0 ? Math.round((currentUser.fact / currentUser.plan) * 100) : 0;
  const remaining = Math.max(0, currentUser.plan - currentUser.fact);
  const myRank = [...employees].sort((a, b) => (b.fact / Math.max(b.plan, 1)) - (a.fact / Math.max(a.plan, 1))).findIndex(e => e.id === currentUser.id) + 1;
  
  // Получаем цвет профиля пользователя для баннера
  const userColor = COLOR_MAP[currentUser.profileColor] || COLOR_MAP.pink;

  // Handle fact update for employee
  const [editFact, setEditFact] = useState(false);
  const [factValue, setFactValue] = useState(currentUser.fact);

  const handleSaveFact = () => {
    updateCurrentUser({ fact: factValue });
    setEditFact(false);
    showToast('✅ Результат обновлён!');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome Banner - Individual for each user */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : `bg-gradient-to-r ${userColor.gradient}`} text-white`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 overflow-hidden flex-shrink-0">
            {currentUser.avatar.startsWith('data:image') ? (
              <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{currentUser.avatar}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">Привет, {currentUser.name}! 💖</h2>
            <p className="opacity-90 text-sm sm:text-base">Сегодня отличный день для новых побед!</p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="text-xs opacity-80">Значки</div>
                <div className="font-bold text-lg">{currentUser.achievements.length} 🏅</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="text-xs opacity-80">Место</div>
                <div className="font-bold text-lg">#{myRank || '-'} 📊</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Important Announcements, Brand of Month, Promo of Month */}
      {(departmentPlan.brandOfMonth || departmentPlan.promoOfMonth || departmentPlan.importantAnnouncements) && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-yellow-500">📢</span>
            Информация для команды
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentPlan.brandOfMonth && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏆</span>
                  <span className="font-bold text-sm opacity-70">Бренд месяца</span>
                </div>
                <p className="font-bold text-lg">{departmentPlan.brandOfMonth}</p>
              </div>
            )}
            {departmentPlan.promoOfMonth && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border ${darkMode ? 'border-green-800' : 'border-green-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-bold text-sm opacity-70">Акция месяца</span>
                </div>
                <p className="font-bold text-lg">{departmentPlan.promoOfMonth}</p>
              </div>
            )}
          </div>
          {departmentPlan.importantAnnouncements && (
            <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} border ${darkMode ? 'border-amber-800' : 'border-amber-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚠️</span>
                <span className="font-bold text-sm opacity-70">Важные объявления</span>
              </div>
              <p className="whitespace-pre-wrap">{departmentPlan.importantAnnouncements}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Department Plan (visible to all) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white"><Users size={20} /></div>
              <div>
                <h3 className="font-bold text-sm">План отдела</h3>
                <p className="text-xs opacity-60">{employees.length} участников</p>
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{departmentPlan.percentage}%</div>
          </div>
          <ProgressBar percentage={departmentPlan.percentage} color="from-blue-400 to-purple-400" />
          <div className="flex justify-between mt-3 text-xs opacity-60">
            <span>{(departmentPlan.current / 1000000).toFixed(2)}M ₽</span>
            <span>{(departmentPlan.total / 1000000).toFixed(1)}M ₽</span>
          </div>
        </motion.div>

        {/* Personal Plan */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white"><Target size={20} /></div>
              <div>
                <h3 className="font-bold text-sm">Мой план</h3>
                <p className="text-xs opacity-60">Июнь 2024</p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${personalPercent >= 110 ? 'text-green-500' : personalPercent >= 100 ? 'text-blue-500' : 'text-orange-500'}`}>{personalPercent}%</div>
          </div>
          <ProgressBar percentage={Math.min(personalPercent, 100)} color={personalPercent >= 110 ? 'from-green-400 to-emerald-400' : 'from-orange-400 to-pink-400'} />
          <div className="flex justify-between mt-3 text-xs opacity-60">
            <span>{(currentUser.fact / 1000).toFixed(0)}K ₽ факт</span>
            <span>{(currentUser.plan / 1000).toFixed(0)}K ₽ план</span>
          </div>
          {remaining > 0 && (
            <div className="mt-2 text-xs">
              <span className="opacity-60">Осталось: </span>
              <span className="font-bold text-pink-500">{(remaining / 1000).toFixed(0)}K ₽</span>
            </div>
          )}
          {/* Update fact button */}
          {!editFact ? (
            <button onClick={() => { setFactValue(currentUser.fact); setEditFact(true); }} className="mt-3 text-xs text-pink-500 font-medium hover:underline">
              📝 Обновить результат
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <input type="number" value={factValue} onChange={e => setFactValue(Number(e.target.value))}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              <button onClick={handleSaveFact} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold">✓</button>
              <button onClick={() => setEditFact(false)} className={`px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>✕</button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard emoji="🎯" label="До 110%" value={`${Math.max(0, 110 - personalPercent)}%`} color="from-pink-100 to-rose-100" darkColor="from-pink-900/30 to-rose-900/30" darkMode={darkMode} />
        <StatCard emoji="⭐" label="Значков" value={`${currentUser.achievements.length}`} color="from-amber-100 to-yellow-100" darkColor="from-amber-900/30 to-yellow-900/30" darkMode={darkMode} />
        <StatCard emoji="🪙" label="EAST Coins" value={currentUser.salesCoins.toLocaleString()} color="from-blue-100 to-cyan-100" darkColor="from-blue-900/30 to-cyan-900/30" darkMode={darkMode} />
        <StatCard emoji="📊" label="Место" value={`#${myRank || '-'}`} color="from-purple-100 to-violet-100" darkColor="from-purple-900/30 to-violet-900/30" darkMode={darkMode} />
      </div>

      {/* My Recent Achievements */}
      <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-purple-500">🏅</span>
          Мои последние значки
        </h3>
        {currentUser.achievements.length === 0 ? (
          <p className="text-sm opacity-60 text-center py-4">Пока нет значков. Выполняйте план, чтобы получить первые! 🌟</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentUser.achievements.slice(-6).reverse().map((ach) => (
              <motion.div key={ach.id} whileHover={{ scale: 1.1, rotate: 5 }}
                className={`aspect-square rounded-xl ${rarityColors[ach.rarity].bg} border ${rarityColors[ach.rarity].border} flex flex-col items-center justify-center p-2 cursor-pointer`}>
                <span className="text-2xl sm:text-3xl">{ach.emoji}</span>
                <span className="text-[8px] sm:text-[10px] font-medium text-center mt-1 leading-tight">{ach.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* My Purchased Prizes */}
      {currentUser.purchasedPrizes && currentUser.purchasedPrizes.length > 0 && (
        <div className={`rounded-2xl p-5 sm:p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-amber-500">🎁</span>
            Мои купленные награды
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentUser.purchasedPrizes.slice().reverse().map((prize) => (
              <motion.div key={prize.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={`rounded-xl p-3 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'} text-center`}>
                <div className="text-3xl mb-1">{prize.emoji}</div>
                <div className="text-xs font-bold truncate">{prize.name}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{new Date(prize.purchasedAt).toLocaleDateString()}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ACHIEVEMENTS VIEW ============
function AchievementsView({ darkMode }: { darkMode: boolean }) {
  const { currentUser, achievementTemplates } = useAppState();
  if (!currentUser) return null;
  
  // Получаем только достижения, созданные администратором
  const allAchievements = achievementTemplates;
  
  // Разделяем на полученные и недоступные
  const obtained = allAchievements.filter(a => 
    currentUser.achievements.some(ua => ua.id === a.id || ua.name === a.name)
  );
  const locked = allAchievements.filter(a => 
    !currentUser.achievements.some(ua => ua.id === a.id || ua.name === a.name)
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-amber-500">🏆</span> Мои достижения</h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-pink-100'}`}>{currentUser.achievements.length} получено</span>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-3">✨ Полученные ({obtained.length})</h3>
        {obtained.length === 0 ? (
          <p className="text-sm opacity-60 text-center py-8">Пока нет полученных достижений. Администратор может выдать вам достижение! 🚀</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {obtained.map((ach, i) => (
              <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className={`p-4 rounded-2xl border-2 ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].border} shadow-sm`}>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{ach.emoji}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].text} font-bold`}>{rarityColors[ach.rarity].label}</span>
                </div>
                <h4 className="font-bold text-sm mt-2">{ach.name}</h4>
                <p className="text-xs opacity-60 mt-1">{ach.description}</p>
                <span className="text-xs opacity-50 mt-2">📅 {currentUser.achievements.find(ua => ua.id === ach.id)?.date || ach.createdAt.split('T')[0]}</span>
                {ach.cost > 0 && <div className="text-xs text-amber-600 font-bold mt-1">💰 +{ach.cost} EAST Coins</div>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Lock size={18} className="text-gray-400" /> Доступные для получения ({locked.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locked.map((ach, i) => (
            <div key={ach.id} className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} opacity-60`}>
              <span className="text-4xl grayscale">{ach.emoji}</span>
              <h4 className="font-bold text-sm mt-2">{ach.name}</h4>
              <p className="text-xs opacity-60 mt-1">{ach.description}</p>
              <span className={`text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full ${rarityColors[ach.rarity].bg} ${rarityColors[ach.rarity].text} font-medium`}>{rarityColors[ach.rarity].label}</span>
              {ach.cost > 0 && <div className="text-xs text-amber-600 font-bold mt-1">💰 +{ach.cost} EAST Coins</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SHOP VIEW ============
function ShopView({ darkMode, prizes, salesCoins, onSpend }: { darkMode: boolean; prizes: any[]; salesCoins: number; onSpend: (amount: number, name: string, prize: any) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const categories = ['Все', ...new Set(prizes.map(p => p.category))];
  const filtered = selectedCategory === 'Все' ? prizes : prizes.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-pink-500">🎁</span> Витрина наград</h2>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-gradient-to-r from-yellow-100 to-amber-100'}`}>
          <span>🪙</span><span className="font-bold text-amber-600">{salesCoins} EAST Coins</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prize, i) => (
          <motion.div key={prize.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm hover:shadow-lg transition-all`}>
            <div className="text-4xl mb-3">{prize.emoji}</div>
            <h3 className="font-bold">{prize.name}</h3>
            <p className="text-sm opacity-60 mt-1">{prize.description}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1"><span>🪙</span><span className="font-bold text-amber-600">{prize.cost}</span></div>
              <button onClick={() => onSpend(prize.cost, prize.name, prize)} disabled={salesCoins < prize.cost}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${salesCoins >= prize.cost ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {salesCoins >= prize.cost ? 'Обменять' : 'Мало монет'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ LEADERBOARD VIEW ============
function LeaderboardView({ darkMode, employees, currentUserId }: { darkMode: boolean; employees: User[]; currentUserId: string }) {
  const sorted = [...employees].sort((a, b) => (b.fact / Math.max(b.plan, 1)) - (a.fact / Math.max(a.plan, 1)));

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-amber-500">🏅</span> Таблица лидеров</h2>
      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-3 sm:gap-6 py-6">
          {[sorted[1], sorted[0], sorted[2]].map((emp, i) => {
            const positions = [1, 0, 2];
            const heights = ['h-24', 'h-32', 'h-20'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <motion.div key={emp.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: positions[i] * 0.2 }} className="flex flex-col items-center">
                <div className="text-3xl sm:text-4xl mb-2 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  {emp.avatar.startsWith('data:image') ? (
                    <img src={emp.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    emp.avatar
                  )}
                </div>
                <span className="text-lg">{medals[i]}</span>
                <div className="font-bold text-sm mt-1">{emp.name}</div>
                <div className="text-xs opacity-60">{Math.round((emp.fact / Math.max(emp.plan, 1)) * 100)}%</div>
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
          <motion.div key={emp.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 sm:gap-4 p-4 ${i !== sorted.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}` : ''} ${emp.id === currentUserId ? (darkMode ? 'bg-pink-900/20' : 'bg-pink-50') : ''}`}>
            <span className="w-8 text-center font-bold text-lg">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
            <span className="text-2xl w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
              {emp.avatar.startsWith('data:image') ? (
                <img src={emp.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                emp.avatar
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{emp.name} {emp.id === currentUserId && <span className="text-pink-500 text-xs">(Вы)</span>}</div>
              <div className="text-xs opacity-60">
                {emp.department && <span className="mr-2">📋 {emp.department}</span>}
                {emp.achievements.length} значков
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm">{Math.round((emp.fact / Math.max(emp.plan, 1)) * 100)}%</div>
              <div className="text-xs opacity-60">{(emp.fact / 1000).toFixed(0)}K ₽</div>
            </div>
          </motion.div>
        ))}
        {sorted.length === 0 && <p className="text-center py-8 opacity-60">Пока нет участников</p>}
      </div>
    </div>
  );
}

// ============ ANALYTICS VIEW (Admin) ============
function AnalyticsView({ darkMode, employees, departmentPlan, showToast }: { darkMode: boolean; employees: User[]; departmentPlan: any; showToast: (m: string) => void }) {
  const teamData = employees.map(m => ({ 
    name: m.name.split(' ')[0], 
    department: m.department || '',
    percent: Math.round((m.fact / Math.max(m.plan, 1)) * 100) 
  }));

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-blue-500">📊</span> Аналитика</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold">{departmentPlan.percentage}%</div>
          <div className="text-xs opacity-60">Отдел</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold">{employees.filter(m => (m.fact / Math.max(m.plan, 1)) >= 1).length}/{employees.length}</div>
          <div className="text-xs opacity-60">Выполнили план</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">🌟</div>
          <div className="text-2xl font-bold">{employees.filter(m => (m.fact / Math.max(m.plan, 1)) >= 1.1).length}</div>
          <div className="text-xs opacity-60">Перевыполнили</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-bold">{(departmentPlan.current / 1000000).toFixed(1)}M</div>
          <div className="text-xs opacity-60">Общий факт</div>
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
              <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============ PROFILE VIEW ============
function ProfileView({ darkMode, showToast }: { darkMode: boolean; showToast: (m: string) => void }) {
  const { currentUser, updateCurrentUser, isAdmin } = useAppState();
  if (!currentUser) return null;

  const admin = isAdmin();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const avatarEmojis = ['👩‍💼', '👩‍🦰', '👩‍🦱', '💁‍♀️', '🧕', '👱‍♀️', '👩', '🧑‍💼', '👩‍🔬', '🧝‍♀️', '🦸‍♀️', '🧙‍♀️', '👨‍💼', '👨‍🦰', '👨‍🦱', '🧔', '👨', '🧑', '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🌸', '🌺', '🌻', '⭐', '🌙', '🔥', '💎', '🎀'];

  const profileColors = [
    { value: 'pink', label: 'Розовый', gradient: 'from-pink-400 via-purple-400 to-indigo-400' },
    { value: 'purple', label: 'Фиолетовый', gradient: 'from-purple-400 via-indigo-400 to-blue-400' },
    { value: 'blue', label: 'Синий', gradient: 'from-blue-400 via-cyan-400 to-teal-400' },
    { value: 'green', label: 'Зелёный', gradient: 'from-green-400 via-emerald-400 to-teal-400' },
    { value: 'amber', label: 'Золотой', gradient: 'from-amber-400 via-orange-400 to-red-400' },
    { value: 'red', label: 'Красный', gradient: 'from-red-400 via-rose-400 to-pink-400' },
    { value: 'cyan', label: 'Бирюзовый', gradient: 'from-cyan-400 via-blue-400 to-indigo-400' },
    { value: 'rose', label: 'Коралловый', gradient: 'from-rose-400 via-pink-400 to-fuchsia-400' },
    { value: 'teal', label: 'Мятный', gradient: 'from-teal-400 via-green-400 to-emerald-400' },
    { value: 'indigo', label: 'Индиго', gradient: 'from-indigo-400 via-purple-400 to-pink-400' },
    { value: 'orange', label: 'Оранжевый', gradient: 'from-orange-400 via-amber-400 to-yellow-400' },
    { value: 'lime', label: 'Лайм', gradient: 'from-lime-400 via-green-400 to-teal-400' },
    { value: 'sky', label: 'Небесный', gradient: 'from-sky-400 via-blue-400 to-indigo-400' },
    { value: 'violet', label: 'Фиалковый', gradient: 'from-violet-400 via-fuchsia-400 to-pink-400' },
    { value: 'slate', label: 'Серый', gradient: 'from-slate-400 via-gray-400 to-zinc-400' },
    { value: 'emerald', label: 'Изумрудный', gradient: 'from-emerald-400 via-green-400 to-cyan-400' },
  ];

  const handleSave = () => {
    updateCurrentUser({ name: editName });
    setEditing(false);
    showToast('✅ Профиль обновлён!');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateCurrentUser({ avatar: base64 });
        setShowAvatarPicker(false);
        showToast('🖼️ Аватар обновлён!');
      };
      reader.readAsDataURL(file);
    }
  };

  const isImageAvatar = currentUser.avatar.startsWith('data:image');
  const currentColor = profileColors.find(c => c.value === currentUser.profileColor) || profileColors[0];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : `bg-gradient-to-r ${currentColor.gradient}`} text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 overflow-hidden cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              {isImageAvatar ? (
                <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{currentUser.avatar}</span>
              )}
            </div>
            <button onClick={() => setShowAvatarPicker(true)} className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-sm hover:scale-110 transition-transform">
              📷
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="px-3 py-1 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none" />
                <button onClick={handleSave} className="px-3 py-1 bg-white/20 rounded-lg text-sm">✓</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1 bg-white/20 rounded-lg text-sm">✕</button>
              </div>
            ) : (
              <h2 className="text-2xl font-bold">{currentUser.name} <button onClick={() => setEditing(true)} className="text-sm opacity-60 hover:opacity-100">✏️</button></h2>
            )}
            <p className="opacity-80">{currentUser.email}</p>
            {currentUser.department && <p className="opacity-60 text-sm">📋 {currentUser.department}</p>}
          </div>
        </div>
      </motion.div>

      {/* Customization */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold text-lg mb-4">🎨 Персонализация</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => setShowAvatarPicker(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${darkMode ? 'border-gray-700 hover:border-pink-600 bg-gray-700/50' : 'border-gray-200 hover:border-pink-300 bg-gray-50'}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-xl overflow-hidden">
              {isImageAvatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : currentUser.avatar}
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Изменить аватар</div>
              <div className="text-xs opacity-60">Эмодзи или своё фото</div>
            </div>
          </button>
          <button onClick={() => setShowColorPicker(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${darkMode ? 'border-gray-700 hover:border-pink-600 bg-gray-700/50' : 'border-gray-200 hover:border-pink-300 bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentColor.gradient}`} />
            <div className="text-left">
              <div className="font-bold text-sm">Цвет профиля</div>
              <div className="text-xs opacity-60">{currentColor.label}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAvatarPicker(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-h-[80vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Выберите аватар</h3>
                <button onClick={() => setShowAvatarPicker(false)}><X size={24} /></button>
              </div>
              <div className="grid grid-cols-6 gap-3 mb-4">
                {avatarEmojis.map((emoji) => (
                  <button key={emoji} onClick={() => { updateCurrentUser({ avatar: emoji }); setShowAvatarPicker(false); showToast('✅ Аватар обновлён!'); }}
                    className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center transition-all hover:scale-110 ${currentUser.avatar === emoji && !isImageAvatar ? 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 ring-2 ring-pink-400' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-sm font-medium mb-2">📷 Или загрузите своё фото:</p>
                <label className={`block w-full py-3 px-4 rounded-xl text-center cursor-pointer font-bold text-sm transition-all ${darkMode ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg' : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg'}`}>
                  Выбрать файл
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowColorPicker(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Цвет профиля</h3>
                <button onClick={() => setShowColorPicker(false)}><X size={24} /></button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {profileColors.map((c) => (
                  <button key={c.value} onClick={() => { updateCurrentUser({ profileColor: c.value }); setShowColorPicker(false); showToast('🎨 Цвет обновлён!'); }}
                    className={`h-16 rounded-xl bg-gradient-to-r ${c.gradient} ring-3 transition-all ${currentUser.profileColor === c.value ? 'ring-offset-2 ring-pink-400 scale-110 shadow-lg' : 'ring-transparent hover:scale-105'} ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}`}
                    title={c.label} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ CHALLENGES VIEW ============
function ChallengesView({ darkMode, challenges, updateChallengeProgress, claimChallengeReward, showToast }: { darkMode: boolean; challenges: any[]; updateChallengeProgress: (id: string, userId: string, delta: number) => void; claimChallengeReward: (id: string, userId: string) => void; showToast: (m: string) => void }) {
  const { currentUser } = useAppState();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'seasonal'>('daily');
  
  // Фильтруем челленджи: показываем только назначенные текущему пользователю и администраторам
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'creator';
  const filtered = challenges.filter(c => {
    if (c.type !== activeTab) return false;
    
    // Если челлендж не назначен никому - не показываем (теперь все челленджи должны быть назначены)
    if (!c.assignedTo || c.assignedTo.length === 0) {
      return false;
    }
    
    // Если челлендж персональный - видим только назначенным пользователям и админам
    if (isAdmin) return true;
    return c.assignedTo.includes(currentUser?.id || '');
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-yellow-500">⚡</span> Челленджи</h2>
      <div className="flex gap-2">
        {([
          { key: 'daily' as const, label: 'Ежедневные', emoji: '🌅' },
          { key: 'weekly' as const, label: 'Еженедельные', emoji: '📅' },
          { key: 'seasonal' as const, label: 'Сезонные', emoji: '🌞' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className={`rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-bold">Нет активных челленджей</p>
          <p className="text-sm opacity-60 mt-1">Администратор скоро добавит новые задания!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((challenge, i) => {
            // Получаем прогресс текущего пользователя
            const userProgress = challenge.progressByUser?.[currentUser?.id || ''] || { progress: 0, completed: false, rewardClaimed: false };
            const percentage = (userProgress.progress / challenge.total) * 100;
            const isCompleted = userProgress.completed;
            const canClaimReward = isCompleted && !userProgress.rewardClaimed;
            
            return (
            <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-3xl shrink-0">{challenge.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{challenge.title}</h3>
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">+{challenge.xpReward} 🪙</span>
                  </div>
                  <p className="text-sm opacity-60 mt-1">{challenge.description}</p>
                  <div className="mt-3">
                    <ProgressBar percentage={percentage} color="from-yellow-400 to-orange-400" />
                    <div className="flex justify-between mt-1 text-xs opacity-60">
                      <span>{userProgress.progress}/{challenge.total}</span>
                      <span>⏰ {challenge.deadline}</span>
                    </div>
                  </div>
                  {!isCompleted && (
                    <button onClick={() => { updateChallengeProgress(challenge.id, currentUser?.id || '', 1); if (userProgress.progress + 1 >= challenge.total) showToast('🎉 Челлендж выполнен!'); }}
                      className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg text-xs font-bold">+1 Прогресс</button>
                  )}
                  {canClaimReward && (
                    <button onClick={() => { claimChallengeReward(challenge.id, currentUser?.id || ''); showToast(`🎉 Получено ${challenge.xpReward} EAST coin!`); }}
                      className="mt-2 ml-2 px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg text-xs font-bold">Получить награду</button>
                  )}
                  {isCompleted && userProgress.rewardClaimed && <span className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold">✅ Награда получена!</span>}
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ NOTIFICATIONS VIEW ============
function NotificationsView({ darkMode, notifications, onMarkRead, onMarkAllRead }: { darkMode: boolean; notifications: any[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void }) {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-pink-500">🔔</span> Уведомления</h2>
        <button onClick={onMarkAllRead} className="text-sm text-pink-500 font-medium hover:underline">Прочитать все</button>
      </div>
      {notifications.length === 0 ? (
        <div className={`rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-pink-100'}`}>
          <div className="text-4xl mb-3">🔔</div>
          <p className="opacity-60">Нет уведомлений</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => onMarkRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${!notif.read ? (darkMode ? 'bg-pink-900/20 border border-pink-800' : 'bg-pink-50 border border-pink-200') : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100')}`}>
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
      )}
    </div>
  );
}

// ============ TEAM VIEW (Admin only) ============
function TeamView({ darkMode, users, currentUser, updateUser, removeUser, promoteToAdmin, demoteFromAdmin, showToast }: { darkMode: boolean; users: User[]; currentUser: User; updateUser: (id: string, data: Partial<User>) => void; removeUser: (id: string) => void; promoteToAdmin: (id: string) => void; demoteFromAdmin: (id: string) => void; showToast: (m: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState(0);
  const [editFact, setEditFact] = useState(0);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'employee'>('employee');

  // Показываем всех пользователей кроме создателя и самого себя (если не создатель)
  const employees = users.filter(u => u.role !== 'creator' && u.id !== currentUser.id);
  const isCreator = currentUser.role === 'creator';

  const handleSave = (id: string) => {
    updateUser(id, { 
      plan: editPlan, 
      fact: editFact, 
      name: editName,
      department: editDepartment,
      role: editRole
    });
    setEditingId(null);
    showToast('✅ Данные обновлены!');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-purple-500">👥</span> Управление командой</h2>

      {/* Admin emails info */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Shield size={18} className="text-blue-500" /> Администраторы</h3>
        <div className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <span>👑</span><span className="font-medium">{CREATOR_EMAIL}</span><span className="text-xs opacity-50">(Создатель)</span>
          </div>
          {users.filter((u: User) => u.role === 'admin').map((admin: User) => (
            <div key={admin.id} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
              <span>🛡️</span><span>{admin.email}</span><span className="text-xs opacity-50">(Админ)</span>
            </div>
          ))}
          {users.filter((u: User) => u.role === 'admin').length === 0 && (
            <div className="text-xs opacity-50 p-2">Назначьте администраторов из списка участников ниже</div>
          )}
        </div>
      </div>

      {/* Users list */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-bold">Участники ({employees.length})</h3>
        </div>
        {employees.map((emp, i) => (
          <div key={emp.id} className={`p-4 ${i !== employees.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}` : ''}`}>
            {editingId === emp.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs opacity-60">Имя</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
                  </div>
                  <div>
                    <label className="text-xs opacity-60">Должность / Отдел</label>
                    <input type="text" value={editDepartment} onChange={e => setEditDepartment(e.target.value)}
                      placeholder="Менеджер по продажам"
                      className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
                  </div>
                  <div>
                    <label className="text-xs opacity-60">План месяца (₽)</label>
                    <input type="number" value={editPlan} onChange={e => setEditPlan(Number(e.target.value))}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
                  </div>
                  <div>
                    <label className="text-xs opacity-60">Факт продаж (₽)</label>
                    <input type="number" value={editFact} onChange={e => setEditFact(Number(e.target.value))}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
                  </div>
                </div>
                {isCreator && (
                  <div>
                    <label className="text-xs opacity-60">Роль</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setEditRole('employee')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          editRole === 'employee'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                            : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        👤 Участник
                      </button>
                      <button
                        onClick={() => setEditRole('admin')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          editRole === 'admin'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        🛡️ Администратор
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>Отмена</button>
                  <button onClick={() => handleSave(emp.id)} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Save size={12} /> Сохранить</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                  {emp.avatar.startsWith('data:image') ? (
                    <img src={emp.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    emp.avatar
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {emp.name}
                    {emp.role === 'admin' && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">🛡️ Админ</span>}
                  </div>
                  <div className="text-xs opacity-60">{emp.email}</div>
                  {emp.department && <div className="text-xs opacity-60">📋 {emp.department}</div>}
                  <div className="text-xs opacity-60">План: {(emp.plan / 1000).toFixed(0)}K ₽ • Факт: {(emp.fact / 1000).toFixed(0)}K ₽</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-sm">{Math.round((emp.fact / Math.max(emp.plan, 1)) * 100)}%</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { 
                    setEditingId(emp.id); 
                    setEditPlan(emp.plan); 
                    setEditFact(emp.fact); 
                    setEditName(emp.name);
                    setEditDepartment(emp.department || '');
                    setEditRole(emp.role === 'admin' ? 'admin' : 'employee');
                  }}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'} text-blue-500`} title="Редактировать"><Edit3 size={16} /></button>
                  {isCreator && emp.role !== 'creator' && (
                    <>
                      {emp.role === 'admin' ? (
                        <button onClick={() => { demoteFromAdmin(emp.id); showToast('Роль изменена на участника'); }}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-orange-50'} text-orange-500`} title="Снять админа">🛡️</button>
                      ) : (
                        <button onClick={() => { promoteToAdmin(emp.id); showToast(`${emp.name} назначен администратором!`); }}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} text-purple-500`} title="Назначить админом"><Shield size={16} /></button>
                      )}
                    </>
                  )}
                  {emp.id !== currentUser.id && (
                    <button onClick={() => { removeUser(emp.id); showToast(`${emp.name} удалён`); }}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'} text-red-500`} title="Удалить"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SETTINGS VIEW (Admin only) ============
function SettingsView({ 
  darkMode, 
  showToast, 
  achievementTemplates, 
  addAchievementTemplate, 
  updateAchievementTemplate, 
  removeAchievementTemplate, 
  grantAchievementToUser,
  users,
  currentUser
}: { 
  darkMode: boolean; 
  showToast: (m: string) => void;
  achievementTemplates: AchievementTemplate[];
  addAchievementTemplate: (t: AchievementTemplate) => void;
  updateAchievementTemplate: (id: string, data: Partial<AchievementTemplate>) => void;
  removeAchievementTemplate: (id: string) => void;
  grantAchievementToUser: (userId: string, achievementId: string) => void;
  users: User[];
  currentUser: User;
}) {
  const { companySettings, updateCompanySettings, departmentPlan, updateDepartmentPlan, prizes, addPrize, updatePrize, removePrize, challenges, addChallenge, removeChallenge, assignChallenge, planArchives, archiveCurrentMonthPlan, updatePlanArchive, removePlanArchive } = useAppState();

  const [localName, setLocalName] = useState(companySettings.name);
  const [localColor, setLocalColor] = useState(companySettings.mainColor);
  const [planTotal, setPlanTotal] = useState(departmentPlan.total);
  const [brandMonth, setBrandMonth] = useState(departmentPlan.brandOfMonth);
  const [promoMonth, setPromoMonth] = useState(departmentPlan.promoOfMonth);
  const [importantAnnouncements, setImportantAnnouncements] = useState(departmentPlan.importantAnnouncements);

  // New prize form
  const [showNewPrize, setShowNewPrize] = useState(false);
  const [newPrizeEmoji, setNewPrizeEmoji] = useState('🎁');
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState(100);
  const [newPrizeCat, setNewPrizeCat] = useState('Разное');

  // New challenge form
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeEmoji, setNewChallengeEmoji] = useState('🎯');
  const [newChallengeXP, setNewChallengeXP] = useState(50);
  const [newChallengeTotal, setNewChallengeTotal] = useState(10);
  const [newChallengeType, setNewChallengeType] = useState<'daily' | 'weekly' | 'seasonal'>('daily');
  const [newChallengeDeadline, setNewChallengeDeadline] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Achievements management
  const [manageAchievementsTab, setManageAchievementsTab] = useState<'list' | 'create' | 'grant'>('list');
  const [newAchievementName, setNewAchievementName] = useState('');
  const [newAchievementDesc, setNewAchievementDesc] = useState('');
  const [newAchievementEmoji, setNewAchievementEmoji] = useState('🏆');
  const [newAchievementRarity, setNewAchievementRarity] = useState<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>('common');
  const [newAchievementCost, setNewAchievementCost] = useState(50);
  const [newAchievementImage, setNewAchievementImage] = useState('');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantAchievementId, setGrantAchievementId] = useState('');

  const handleSaveSettings = () => {
    updateCompanySettings({ name: localName, mainColor: localColor });
    showToast('✅ Настройки сохранены!');
  };

  const handleSavePlan = () => {
    updateDepartmentPlan({ total: planTotal, brandOfMonth: brandMonth, promoOfMonth: promoMonth, importantAnnouncements });
    showToast('✅ План отдела обновлён!');
  };

  const handleAddPrize = () => {
    if (!newPrizeName.trim()) return;
    addPrize({ id: Date.now().toString(), name: newPrizeName, emoji: newPrizeEmoji, description: newPrizeDesc, cost: newPrizeCost, available: true, category: newPrizeCat });
    setShowNewPrize(false);
    setNewPrizeName('');
    setNewPrizeDesc('');
    showToast('🎁 Приз добавлен!');
  };

  const handleAddChallenge = () => {
    console.log('Попытка создания челленджа:', { newChallengeTitle, newChallengeDesc, newChallengeXP, newChallengeTotal });
    
    if (!newChallengeTitle.trim()) {
      showToast('❌ Введите название челленджа');
      console.error('Ошибка: не заполнено название');
      return;
    }
    if (!newChallengeDesc.trim()) {
      showToast('❌ Введите описание челленджа');
      console.error('Ошибка: не заполнено описание');
      return;
    }
    if (newChallengeXP <= 0) {
      showToast('❌ Награда должна быть больше 0');
      console.error('Ошибка: награда меньше или равна 0');
      return;
    }
    if (newChallengeTotal <= 0) {
      showToast('❌ Цель должна быть больше 0');
      console.error('Ошибка: цель меньше или равна 0');
      return;
    }
    
    const isGlobal = selectedUserIds.length === 0;
    const assignedTo: string[] = isGlobal ? users.filter(u => u.role === 'employee').map(u => u.id) : [...selectedUserIds];
    const challenge: Challenge = {
      id: Date.now().toString(),
      title: newChallengeTitle,
      description: newChallengeDesc,
      emoji: newChallengeEmoji,
      xpReward: newChallengeXP,
      total: newChallengeTotal,
      deadline: newChallengeDeadline || `${newChallengeType === 'daily' ? 'Сегодня' : newChallengeType === 'weekly' ? 'Конец недели' : 'Конец сезона'}`,
      type: newChallengeType,
      assignedTo,
      progressByUser: {}, // персональный прогресс каждого участника
    };
    
    console.log('Созданный объект челленджа:', challenge);
    addChallenge(challenge);
    console.log('Челлендж добавлен через addChallenge');
    
    // Send notifications to assigned users
    if (!isGlobal && selectedUserIds.length > 0) {
      selectedUserIds.forEach(userId => {
        const user = users.find(u => u.id === userId);
        if (user) {
          // Notification will be added via addNotification if available
        }
      });
    }
    
    setShowNewChallenge(false);
    setNewChallengeTitle('');
    setNewChallengeDesc('');
    setNewChallengeEmoji('🎯');
    setNewChallengeXP(50);
    setNewChallengeTotal(10);
    setNewChallengeType('daily');
    setNewChallengeDeadline('');
    setSelectedUserIds([]);
    showToast('✅ Челлендж успешно создан!');
  };

  const handleArchiveMonth = () => {
    archiveCurrentMonthPlan();
    showToast('📦 Месяц заархивирован!');
  };

  // Achievement handlers
  const handleAddAchievement = () => {
    if (!newAchievementName.trim()) return;
    const template: AchievementTemplate = {
      id: Date.now().toString(),
      name: newAchievementName,
      description: newAchievementDesc,
      emoji: newAchievementEmoji,
      rarity: newAchievementRarity,
      cost: newAchievementCost,
      image: newAchievementImage || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addAchievementTemplate(template);
    setNewAchievementName('');
    setNewAchievementDesc('');
    setNewAchievementEmoji('🏆');
    setNewAchievementRarity('common');
    setNewAchievementCost(50);
    setNewAchievementImage('');
    showToast('🏆 Достижение создано!');
  };

  const handleGrantAchievement = () => {
    if (!grantUserId || !grantAchievementId) return;
    grantAchievementToUser(grantUserId, grantAchievementId);
    setGrantUserId('');
    setGrantAchievementId('');
    showToast('✅ Достижение выдано сотруднику!');
  };

  const colors = [
    { value: 'pink', label: 'Розовый', preview: 'bg-pink-500' },
    { value: 'purple', label: 'Фиолетовый', preview: 'bg-purple-500' },
    { value: 'blue', label: 'Синий', preview: 'bg-blue-500' },
    { value: 'green', label: 'Зелёный', preview: 'bg-green-500' },
    { value: 'amber', label: 'Золотой', preview: 'bg-amber-500' },
    { value: 'red', label: 'Красный', preview: 'bg-red-500' },
    { value: 'cyan', label: 'Бирюзовый', preview: 'bg-cyan-500' },
    { value: 'rose', label: 'Коралловый', preview: 'bg-rose-500' },
    { value: 'teal', label: 'Мятный', preview: 'bg-teal-500' },
    { value: 'indigo', label: 'Индиго', preview: 'bg-indigo-500' },
    { value: 'orange', label: 'Оранжевый', preview: 'bg-orange-500' },
    { value: 'lime', label: 'Лайм', preview: 'bg-lime-500' },
    { value: 'sky', label: 'Небесный', preview: 'bg-sky-500' },
    { value: 'violet', label: 'Фиалковый', preview: 'bg-violet-500' },
    { value: 'slate', label: 'Серый', preview: 'bg-slate-500' },
    { value: 'emerald', label: 'Изумрудный', preview: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-gray-500">⚙️</span> Настройки</h2>

      {/* Company Branding */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">🏢 Брендирование</h3>
          <button onClick={handleSaveSettings} className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Save size={14} /> Сохранить</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium opacity-70">Цвет интерфейса</label>
            <div className="flex gap-3 mt-2 flex-wrap">
              {colors.map(c => (
                <button key={c.value} onClick={() => setLocalColor(c.value)} title={c.label}
                  className={`w-12 h-12 rounded-xl ${c.preview} ring-3 transition-all ${localColor === c.value ? 'ring-offset-2 ring-pink-400 scale-110 shadow-lg' : 'ring-transparent hover:scale-105'} ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}`} />
              ))}
            </div>
            <p className="text-xs opacity-50 mt-2">Выбрано: {colors.find(c => c.value === localColor)?.label || 'Розовый'}</p>
          </div>
        </div>
      </div>

      {/* Department Plan */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">📋 План отдела</h3>
          <div className="flex gap-2">
            <button onClick={handleArchiveMonth} className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Save size={14} /> Архивировать месяц</button>
            <button onClick={handleSavePlan} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Save size={14} /> Сохранить</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs opacity-60 font-medium">Общий план (₽)</label>
            <input type="number" value={planTotal} onChange={e => setPlanTotal(Number(e.target.value))}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
          </div>
          <div>
            <label className="text-xs opacity-60 font-medium">Бренд месяца</label>
            <input type="text" value={brandMonth} onChange={e => setBrandMonth(e.target.value)}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
          </div>
          <div>
            <label className="text-xs opacity-60 font-medium">Акция месяца</label>
            <input type="text" value={promoMonth} onChange={e => setPromoMonth(e.target.value)}
              className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs opacity-60 font-medium">Важные объявления</label>
          <textarea value={importantAnnouncements} onChange={e => setImportantAnnouncements(e.target.value)} rows={3}
            className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none`} 
            placeholder="Введите важные объявления для команды..." />
        </div>
        <div className="mt-4 text-xs opacity-60">
          <p>Текущий период: {departmentPlan.month}</p>
        </div>
      </div>

      {/* Plan Archives */}
      {planArchives.length > 0 && (
        <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
          <h3 className="font-bold mb-4">📦 Архив планов ({planArchives.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {planArchives.slice().reverse().map(archive => (
              <div key={archive.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{archive.name || `${archive.month} ${archive.year}`}</div>
                    <div className="text-xs opacity-60">План: {(archive.totalPlan / 1000).toFixed(0)}K ₽ • Факт: {(archive.totalFact / 1000).toFixed(0)}K ₽ • {archive.percentage}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs opacity-40">{new Date(archive.archivedAt).toLocaleDateString()}</div>
                    <button onClick={() => {
                      const newName = prompt('Введите название архива:', archive.name || `${archive.month} ${archive.year}`);
                      if (newName !== null) updatePlanArchive(archive.id, { name: newName || undefined });
                    }} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500" title="Редактировать"><Edit3 size={14} /></button>
                    <button onClick={() => {
                      const newTotal = prompt('Введите новый общий план:', String(archive.totalPlan));
                      if (newTotal !== null) updatePlanArchive(archive.id, { totalPlan: Number(newTotal) });
                    }} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500" title="Изменить план"><DollarSign size={14} /></button>
                    <button onClick={() => {
                      if (confirm('Удалить этот архив?')) removePlanArchive(archive.id);
                    }} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title="Удалить"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges Management */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">⚡ Управление челленджами ({challenges.length})</h3>
          <button onClick={() => setShowNewChallenge(!showNewChallenge)} className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
            <Plus size={14} /> Создать
          </button>
        </div>

        {showNewChallenge && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`mb-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} space-y-3`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-60">Название</label>
                <input type="text" value={newChallengeTitle} onChange={e => setNewChallengeTitle(e.target.value)} placeholder="Например: 10 звонков"
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Тип</label>
                <select value={newChallengeType} onChange={e => setNewChallengeType(e.target.value as any)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`}>
                  <option value="daily">Ежедневный</option>
                  <option value="weekly">Еженедельный</option>
                  <option value="seasonal">Сезонный</option>
                </select>
              </div>
              <div>
                <label className="text-xs opacity-60">Эмодзи</label>
                <input type="text" value={newChallengeEmoji} onChange={e => setNewChallengeEmoji(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Награда (EAST Coins)</label>
                <input type="number" value={newChallengeXP} onChange={e => setNewChallengeXP(Number(e.target.value))}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Цель (кол-во)</label>
                <input type="number" value={newChallengeTotal} onChange={e => setNewChallengeTotal(Number(e.target.value))}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Дедлайн</label>
                <input type="text" value={newChallengeDeadline} onChange={e => setNewChallengeDeadline(e.target.value)} placeholder="Завтра / Конец недели"
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60">Описание</label>
              <input type="text" value={newChallengeDesc} onChange={e => setNewChallengeDesc(e.target.value)} placeholder="Описание челленджа"
                className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-yellow-300`} />
            </div>
            <div>
              <label className="text-xs opacity-60">Назначить пользователям (оставьте пустым для общего)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {users.filter(u => u.role === 'employee').map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedUserIds.includes(user.id) ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewChallenge(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Отмена</button>
              <button onClick={handleAddChallenge} className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-xs font-bold">Создать челлендж</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {challenges.map(challenge => (
            <div key={challenge.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <span className="text-xl">{challenge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{challenge.title}</div>
                <div className="text-xs opacity-60">{challenge.description} • +{challenge.xpReward} 🪙 • {challenge.type}</div>
                {challenge.assignedTo && challenge.assignedTo.length > 0 && (
                  <div className="text-xs opacity-40">Назначен: {challenge.assignedTo.length} пользовател(ей)</div>
                )}
              </div>
              <button onClick={() => { removeChallenge(challenge.id); showToast('Челлендж удалён'); }}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-red-500`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <h3 className="font-bold mb-4">🔔 Эффекты и уведомления</h3>
        <div className="space-y-4">
          {[
            { key: 'soundsEnabled' as const, label: 'Звуки', desc: 'Звуковые эффекты' },
            { key: 'pushEnabled' as const, label: 'Push-уведомления', desc: 'Уведомления в браузере' },
            { key: 'confettiEnabled' as const, label: 'Конфетти', desc: 'Анимация при достижениях' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{item.label}</span>
                <p className="text-xs opacity-50">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={companySettings[item.key]}
                  onChange={e => { updateCompanySettings({ [item.key]: e.target.checked }); showToast(e.target.checked ? `✅ ${item.label} включены` : `${item.label} выключены`); }}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Prizes Management */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">🎁 Управление призами ({prizes.length})</h3>
          <button onClick={() => setShowNewPrize(!showNewPrize)} className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
            <Plus size={14} /> Добавить
          </button>
        </div>

        {showNewPrize && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`mb-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-pink-50'} space-y-3`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs opacity-60">Эмодзи</label>
                <input type="text" value={newPrizeEmoji} onChange={e => setNewPrizeEmoji(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Название</label>
                <input type="text" value={newPrizeName} onChange={e => setNewPrizeName(e.target.value)} placeholder="Название приза"
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Стоимость (монет)</label>
                <input type="number" value={newPrizeCost} onChange={e => setNewPrizeCost(Number(e.target.value))}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-xs opacity-60">Категория</label>
                <input type="text" value={newPrizeCat} onChange={e => setNewPrizeCat(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60">Описание</label>
              <input type="text" value={newPrizeDesc} onChange={e => setNewPrizeDesc(e.target.value)} placeholder="Описание приза"
                className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewPrize(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Отмена</button>
              <button onClick={handleAddPrize} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-bold">Добавить приз</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {prizes.map(prize => (
            <div key={prize.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <span className="text-xl">{prize.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{prize.name}</div>
                <div className="text-xs opacity-60">{prize.description} • 🪙 {prize.cost} • {prize.category}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { updatePrize(prize.id, { cost: prize.cost + 50 }); showToast('Стоимость изменена'); }}
                  className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-blue-500 text-xs`}>+50🪙</button>
                <button onClick={() => { updatePrize(prize.id, { cost: Math.max(0, prize.cost - 50) }); showToast('Стоимость изменена'); }}
                  className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-orange-500 text-xs`}>-50🪙</button>
                <button onClick={() => { removePrize(prize.id); showToast('Приз удалён'); }}
                  className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-red-500`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Management */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">🏆 Управление достижениями ({achievementTemplates.length})</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setManageAchievementsTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${manageAchievementsTab === 'list' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Список достижений
          </button>
          <button onClick={() => setManageAchievementsTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${manageAchievementsTab === 'create' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Создать достижение
          </button>
          <button onClick={() => setManageAchievementsTab('grant')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${manageAchievementsTab === 'grant' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Выдать достижение
          </button>
        </div>

        {/* List Tab */}
        {manageAchievementsTab === 'list' && (
          <div className="space-y-2">
            {achievementTemplates.length === 0 ? (
              <p className="text-sm opacity-60 text-center py-8">Пока нет созданных достижений. Создайте первое! 🚀</p>
            ) : (
              achievementTemplates.map(ach => (
                <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <span className="text-2xl">{ach.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{ach.name}</div>
                    <div className="text-xs opacity-60">{ach.description} • 🪙 {ach.cost} • {ach.rarity}</div>
                  </div>
                  <button onClick={() => { removeAchievementTemplate(ach.id); showToast('Достижение удалено'); }}
                    className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-red-500`}><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Tab */}
        {manageAchievementsTab === 'create' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium opacity-70">Название достижения</label>
                <input type="text" value={newAchievementName} onChange={e => setNewAchievementName(e.target.value)} placeholder="Например: Продавец месяца"
                  className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-sm font-medium opacity-70">Эмодзи</label>
                <input type="text" value={newAchievementEmoji} onChange={e => setNewAchievementEmoji(e.target.value)} placeholder="🏆"
                  className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-sm font-medium opacity-70">Стоимость (EAST Coins)</label>
                <input type="number" value={newAchievementCost} onChange={e => setNewAchievementCost(Number(e.target.value))} placeholder="50"
                  className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
              </div>
              <div>
                <label className="text-sm font-medium opacity-70">Редкость</label>
                <select value={newAchievementRarity} onChange={e => setNewAchievementRarity(e.target.value as any)}
                  className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}>
                  <option value="common">Обычное (Common)</option>
                  <option value="uncommon">Необычное (Uncommon)</option>
                  <option value="rare">Редкое (Rare)</option>
                  <option value="epic">Эпическое (Epic)</option>
                  <option value="legendary">Легендарное (Legendary)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium opacity-70">URL картинки (опционально)</label>
              <input type="text" value={newAchievementImage} onChange={e => setNewAchievementImage(e.target.value)} placeholder="https://example.com/image.png"
                className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
            </div>
            <div>
              <label className="text-sm font-medium opacity-70">Описание</label>
              <textarea value={newAchievementDesc} onChange={e => setNewAchievementDesc(e.target.value)} placeholder="Описание достижения..." rows={3}
                className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`} />
            </div>
            <button onClick={handleAddAchievement} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all">
              <Plus size={18} /> Создать достижение
            </button>
          </motion.div>
        )}

        {/* Grant Tab */}
        {manageAchievementsTab === 'grant' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {achievementTemplates.length === 0 ? (
              <p className="text-sm opacity-60 text-center py-8">Сначала создайте достижения, чтобы выдавать их сотрудникам! 📝</p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium opacity-70">Выберите сотрудника</label>
                  <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)}
                    className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}>
                    <option value="">-- Выберите сотрудника --</option>
                    {users.filter(u => u.role === 'employee').map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-70">Выберите достижение</label>
                  <select value={grantAchievementId} onChange={e => setGrantAchievementId(e.target.value)}
                    className={`w-full mt-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-300`}>
                    <option value="">-- Выберите достижение --</option>
                    {achievementTemplates.map(ach => (
                      <option key={ach.id} value={ach.id}>{ach.emoji} {ach.name} (+{ach.cost} 🪙)</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleGrantAchievement} disabled={!grantUserId || !grantAchievementId}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Award size={18} /> Выдать достижение
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============ SHARED COMPONENTS ============
function ProgressBar({ percentage, color, small }: { percentage: number; color: string; small?: boolean }) {
  return (
    <div className={`w-full ${small ? 'h-2' : 'h-3'} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percentage, 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${color} rounded-full relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
      </motion.div>
    </div>
  );
}

function StatCard({ emoji, label, value, color, darkColor, darkMode }: { emoji: string; label: string; value: string; color: string; darkColor: string; darkMode: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${darkMode ? darkColor : color} border ${darkMode ? 'border-gray-700' : 'border-white/50'} shadow-sm`}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </motion.div>
  );
}

// ============ ROOT ============
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
