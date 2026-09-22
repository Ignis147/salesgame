import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  currentUser as initialUser,
  teamMembers as initialTeam,
  departmentPlan as initialDeptPlan,
  prizes as initialPrizes,
  challenges as initialChallenges,
  notifications as initialNotifications,
  battlePassSeason as initialBP,
  type Employee,
  type Prize,
  type Challenge,
  type Notification,
} from '../data/mockData';

interface DepartmentPlan {
  total: number;
  current: number;
  percentage: number;
  lastMonth: number;
  employees: number;
  brandOfMonth: string;
  promoOfMonth: string;
}

interface CompanySettings {
  name: string;
  mainColor: string;
  soundsEnabled: boolean;
  pushEnabled: boolean;
  confettiEnabled: boolean;
  crmConnected: boolean;
  apiKey: string;
}

interface AppState {
  currentUser: Employee;
  teamMembers: Employee[];
  departmentPlan: DepartmentPlan;
  prizes: Prize[];
  challenges: Challenge[];
  notifications: Notification[];
  battlePass: typeof initialBP;
  companySettings: CompanySettings;
  salesCoins: number;
  userRole: 'employee' | 'manager';

  // Actions
  updateCurrentUser: (data: Partial<Employee>) => void;
  updateTeamMember: (id: string, data: Partial<Employee>) => void;
  removeTeamMember: (id: string) => void;
  addTeamMember: (member: Employee) => void;
  updateDepartmentPlan: (data: Partial<DepartmentPlan>) => void;
  updatePrize: (id: string, data: Partial<Prize>) => void;
  removePrize: (id: string) => void;
  addPrize: (prize: Prize) => void;
  updateChallenge: (id: string, data: Partial<Challenge>) => void;
  spendCoins: (amount: number) => void;
  addCoins: (amount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Notification) => void;
  updateCompanySettings: (data: Partial<CompanySettings>) => void;
  setUserRole: (role: 'employee' | 'manager') => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee>(initialUser);
  const [teamMembers, setTeamMembers] = useState<Employee[]>(initialTeam);
  const [departmentPlan, setDepartmentPlan] = useState<DepartmentPlan>({
    ...initialDeptPlan,
    brandOfMonth: 'Samsung',
    promoOfMonth: 'Летняя распродажа',
  });
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [battlePass] = useState(initialBP);
  const [salesCoins, setSalesCoins] = useState(1250);
  const [userRole, setUserRole] = useState<'employee' | 'manager'>('employee');
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'SalesQuest',
    mainColor: 'bg-pink-500',
    soundsEnabled: true,
    pushEnabled: true,
    confettiEnabled: true,
    crmConnected: true,
    apiKey: 'sk-xxxx-xxxx-xxxx',
  });

  const updateCurrentUser = useCallback((data: Partial<Employee>) => {
    setCurrentUser(prev => ({ ...prev, ...data }));
    // Also update in team members
    setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, ...data } : m));
  }, [currentUser.id]);

  const updateTeamMember = useCallback((id: string, data: Partial<Employee>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    setDepartmentPlan(prev => ({ ...prev, employees: prev.employees - 1 }));
  }, []);

  const addTeamMember = useCallback((member: Employee) => {
    setTeamMembers(prev => [...prev, member]);
    setDepartmentPlan(prev => ({ ...prev, employees: prev.employees + 1 }));
  }, []);

  const updateDepartmentPlan = useCallback((data: Partial<DepartmentPlan>) => {
    setDepartmentPlan(prev => {
      const updated = { ...prev, ...data };
      // Recalculate percentage
      if (data.total !== undefined || data.current !== undefined) {
        const total = data.total ?? prev.total;
        const current = data.current ?? prev.current;
        updated.percentage = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;
      }
      return updated;
    });
  }, []);

  const updatePrize = useCallback((id: string, data: Partial<Prize>) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const removePrize = useCallback((id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPrize = useCallback((prize: Prize) => {
    setPrizes(prev => [...prev, prize]);
  }, []);

  const updateChallenge = useCallback((id: string, data: Partial<Challenge>) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const spendCoins = useCallback((amount: number) => {
    setSalesCoins(prev => Math.max(0, prev - amount));
  }, []);

  const addCoins = useCallback((amount: number) => {
    setSalesCoins(prev => prev + amount);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  }, []);

  const updateCompanySettings = useCallback((data: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser,
      teamMembers,
      departmentPlan,
      prizes,
      challenges,
      notifications,
      battlePass,
      companySettings,
      salesCoins,
      userRole,
      updateCurrentUser,
      updateTeamMember,
      removeTeamMember,
      addTeamMember,
      updateDepartmentPlan,
      updatePrize,
      removePrize,
      addPrize,
      updateChallenge,
      spendCoins,
      addCoins,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      updateCompanySettings,
      setUserRole,
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
