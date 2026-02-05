
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Program, Case, Attendance, Notification, UserRole } from '../../types';
import { 
  Activity, 
  MapPin, 
  Settings, 
  LogOut, 
  X,
  Calendar,
  Clock,
  Bell,
  Truck,
  ShieldCheck,
  LayoutDashboard,
  History,
  ShieldAlert,
  Smartphone,
  ArrowLeftCircle
} from 'lucide-react';
import { db } from '../../services/databaseService';
import ProgramManagement from './ProgramManagement';
import SettingsTab from './SettingsTab';
import NearbyReferrals from '../responder/NearbyReferrals';
import { formatMyDate } from '../../App';

interface MeccLayoutProps {
  user: User;
  onLogout: () => void;
}

const MeccLayout: React.FC<MeccLayoutProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('main');
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLogoutAction = useCallback(() => {
    if (window.confirm("ANDA MAHU KELUAR?\n\nSemua akses pentadbiran MECC akan ditutup.")) {
      onLogout();
    }
  }, [onLogout]);

  const handleForceLogout = useCallback(() => {
    if (window.confirm("FORCE LOGOUT?\n\nSemua data sesi (LocalStorage) akan dipadamkan secara total. Gunakan ini jika log keluar biasa gagal.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = '#/login';
      window.location.reload();
    }
  }, []);

  const handleReturnToLogin = useCallback(() => {
    if (window.confirm("Kembali ke skrin log masuk utama?")) {
      onLogout();
    }
  }, [onLogout]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const currentScrollY = scrollContainerRef.current.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 60) setIsNavVisible(false);
    else setIsNavVisible(true);
    lastScrollY.current = currentScrollY;
  }, []);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const programs = await db.getPrograms(user.state);
      const active = programs.find(p => p.status === 'Active');
      if (active) {
        setActiveProgram(active);
        const [progCases, progNotifs] = await Promise.all([
          db.getCases(active.id),
          db.getNotifications(active.id)
        ]);
        setCases(progCases);
        setNotifications(progNotifs);
      } else setActiveProgram(null);
      const logs = JSON.parse(localStorage.getItem('resq_session_logs') || '[]');
      setSessionLogs(logs);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user.state]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const navigationItems = useMemo(() => [
    { id: 'main', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, badge: notifications.length },
    { id: 'programs', label: 'Program', icon: <MapPin className="w-5 h-5" /> },
    { id: 'security', label: 'Sesi', icon: <History className="w-5 h-5" />, adminOnly: true },
    { id: 'settings', label: 'Setup', icon: <Settings className="w-5 h-5" />, adminOnly: true }
  ], [notifications.length]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter selection:bg-red-100 selection:text-red-900">
      <aside className="hidden lg:flex w-72 bg-slate-950 flex-col sticky top-0 h-screen shrink-0 shadow-2xl z-50">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-900/40 transform -rotate-6"><Activity className="w-6 h-6 text-white" /></div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">resQ Amal</h1>
          </div>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] ml-2">{user.state} MECC ADMIN</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navigationItems.map(item => (!item.adminOnly || user.role === UserRole.MECC) && (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-red-600 text-white shadow-2xl translate-x-2' : 'text-slate-500 hover:text-white'}`}>
              <div className="flex items-center gap-4">{item.icon}{item.label}</div>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-900 space-y-2">
          <button 
            onClick={handleReturnToLogin} 
            className="flex items-center gap-4 px-6 py-3 text-slate-500 hover:text-indigo-400 transition-all w-full font-black uppercase text-[9px] tracking-widest group"
          >
            <ArrowLeftCircle className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Log Masuk Utama
          </button>
          
          <button onClick={handleLogoutAction} className="flex items-center gap-4 px-6 py-3 text-slate-500 hover:text-red-500 transition-all w-full font-black uppercase text-[9px] tracking-widest group">
            <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Log Keluar
          </button>

          <button onClick={handleForceLogout} className="flex items-center gap-4 px-6 py-3 text-red-500 hover:bg-red-500/10 transition-all w-full font-black uppercase text-[8px] tracking-[0.2em] group border border-red-500/20 rounded-xl mt-4">
            <ShieldAlert className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" /> Force Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 py-5 shrink-0 z-40">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <h2 className="text-slate-900 font-black text-xl lg:text-3xl tracking-tighter uppercase">
              {activeTab === 'main' ? 'Pusat Kawalan' : activeTab === 'security' ? 'Log Sejarah Sesi' : activeTab.toUpperCase()}
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-2xl"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[10px] font-black uppercase tracking-widest">{user.name}</span></div>
              <button onClick={handleLogoutAction} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 lg:p-12 bg-slate-50/50 scroll-smooth pb-40 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            {activeTab === 'main' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                {activeProgram ? (
                  <>
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                      <div className="space-y-4">
                        <div className="px-4 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-2">Program Aktif</div>
                        <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">{activeProgram.name}</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" /> {activeProgram.location} • <Calendar className="w-4 h-4 text-blue-500" /> {activeProgram.date}
                        </p>
                      </div>
                      <button onClick={() => setShowReferralModal(true)} className="px-8 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Rujukan Hospital</button>
                    </div>
                  </>
                ) : (
                  <div className="py-48 text-center flex flex-col items-center">
                    <MapPin className="w-24 h-24 text-slate-200 mb-8" />
                    <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">Sistem Sedia Koordinasi</h3>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                 {notifications.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                      <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Tiada Notifikasi Baharu</p>
                   </div>
                 ) : (
                   notifications.map(n => (
                     <div key={n.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${n.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><Bell className="w-5 h-5" /></div>
                        <div>
                           <p className="text-sm font-bold text-slate-800 mb-1">{n.message}</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{n.senderName} • {new Date(n.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            )}

            {activeTab === 'programs' && <ProgramManagement user={user} />}
            
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4"><History className="w-6 h-6 text-red-600" /> Log Sesi Terkini</h3>
                  <div className="space-y-4">
                    {sessionLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-6">
                          <div className={`w-3 h-3 rounded-full ${log.action === 'LOGIN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase">{log.userName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.role} • {log.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatMyDate(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && <SettingsTab user={user} />}
          </div>
        </main>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 w-[90%] max-w-sm">
          <div className={`px-8 py-5 rounded-3xl shadow-2xl flex items-center justify-center gap-4 border ${
            toast.type === 'success' ? 'bg-red-600 border-red-500' : 'bg-slate-900 border-slate-800'
          } text-white`}>
            {toast.type === 'success' ? <ShieldCheck className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
            <p className="font-black text-xs uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowReferralModal(false)}></div>
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Hospital & Klinik Berhampiran (AI)</h3>
                 <button onClick={() => setShowReferralModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                 <NearbyReferrals />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MeccLayout;
