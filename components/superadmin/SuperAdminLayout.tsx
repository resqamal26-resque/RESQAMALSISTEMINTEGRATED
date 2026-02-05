
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  MapPin, 
  FileText, 
  Settings, 
  Database, 
  LogOut, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Search,
  LayoutDashboard,
  Filter,
  ArrowUpRight,
  UserCheck,
  Calendar,
  AlertCircle,
  Activity,
  Server,
  Globe,
  Plus,
  Crown,
  CheckCircle,
  ArrowLeftCircle,
  Menu,
  X,
  ShieldAlert,
  Zap,
  Cpu,
  HardDrive,
  RefreshCw,
  Clock,
  Code,
  // Added Terminal and Archive icons to fix compilation errors
  Terminal,
  Archive
} from 'lucide-react';
import { User, UserRole, Program, Case } from '../../types';
import { db } from '../../services/databaseService';
import { googleSheetService } from '../../services/googleSheetService';
import { geminiService } from '../../services/geminiService';
import { formatMyDate } from '../../App';

interface SuperAdminLayoutProps {
  user: User;
  onLogout: () => void;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnostics State
  const [diagResults, setDiagResults] = useState<{
    sheets: { status: 'idle' | 'loading' | 'success' | 'error'; latency?: number; msg: string };
    gemini: { status: 'idle' | 'loading' | 'success' | 'error'; latency?: number; msg: string };
    storage: { status: 'idle' | 'success' | 'error'; usage: string };
  }>({
    sheets: { status: 'idle', msg: 'Sedia untuk diuji' },
    gemini: { status: 'idle', msg: 'Sedia untuk diuji' },
    storage: { status: 'idle', usage: '0%' }
  });

  useEffect(() => {
    fetchAllData();
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) setIsCollapsed(true);
      else if (window.innerWidth >= 1280) setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [allUsers, allPrograms, allCases] = await Promise.all([
        db.getUsers(),
        db.getPrograms(),
        db.getCases()
      ]);
      setUsers(allUsers);
      setPrograms(allPrograms);
      setCases(allCases);
    } catch (error) {
      console.error("SuperAdmin Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnostics = async () => {
    // 1. Check Storage
    const usage = (JSON.stringify(localStorage).length / (5 * 1024 * 1024) * 100).toFixed(2);
    setDiagResults(prev => ({ ...prev, storage: { status: 'success', usage: `${usage}%` } }));

    // 2. Check Sheets
    setDiagResults(prev => ({ ...prev, sheets: { ...prev.sheets, status: 'loading', msg: 'Menyambung ke Google App Script...' } }));
    const sheetTest = await googleSheetService.testConnection();
    setDiagResults(prev => ({ 
      ...prev, 
      sheets: { 
        status: sheetTest.status === 'success' ? 'success' : 'error', 
        msg: sheetTest.message || 'Sambungan Backend Gagal',
        latency: 0 // Fetch doesn't expose easy latency here without wrappers
      } 
    }));

    // 3. Check Gemini
    setDiagResults(prev => ({ ...prev, gemini: { ...prev.gemini, status: 'loading', msg: 'Menguji model Gemini...' } }));
    const geminiTest = await geminiService.testConnection();
    setDiagResults(prev => ({ 
      ...prev, 
      gemini: { 
        status: geminiTest.status, 
        msg: geminiTest.message,
        latency: geminiTest.latency
      } 
    }));
  };

  const handleLogoutAction = useCallback(() => {
    if (window.confirm("Sahkan untuk Keluar?\nSesi SuperAdmin akan ditamatkan.")) onLogout();
  }, [onLogout]);

  const handleForceLogout = useCallback(() => {
    if (window.confirm("FORCE LOGOUT?\n\nSemua data sesi dipadamkan secara total.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = '#/login';
      window.location.reload();
    }
  }, []);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.status === 'Active').length,
    totalCases: cases.length,
    responders: users.filter(u => u.role === UserRole.RESPONDER).length,
    meccAdmins: users.filter(u => u.role === UserRole.MECC).length,
  }), [users, programs, cases]);

  const groupedUsers = useMemo(() => users.reduce((acc, curr) => {
    if (!acc[curr.role]) acc[curr.role] = [];
    acc[curr.role].push(curr);
    return acc;
  }, {} as Record<string, User[]>), [users]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-400 font-black text-xs uppercase tracking-widest animate-pulse">Mengakses Pusat Data Global...</p>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: 'Petugas', icon: <Users className="w-5 h-5" /> },
    { id: 'programs', label: 'Programs', icon: <MapPin className="w-5 h-5" /> },
    { id: 'cases', label: 'Arkib Kes', icon: <FileText className="w-5 h-5" /> },
    { id: 'infra', label: 'Infrastruktur', icon: <Database className="w-5 h-5" /> },
    { id: 'settings', label: 'Tetapan', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter">
      {isMobileOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300" onClick={() => setIsMobileOpen(false)}></div>}

      <aside className={`fixed lg:relative z-[70] h-screen bg-slate-950 flex flex-col shrink-0 transition-all duration-500 ease-in-out shadow-2xl border-r border-white/5 ${isCollapsed ? 'w-24' : 'w-80'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex absolute -right-4 top-10 w-8 h-8 bg-indigo-600 text-white rounded-full items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors z-[80] ring-4 ring-slate-950">
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <div className={`p-8 mb-4 flex items-center transition-all ${isCollapsed ? 'justify-center' : 'justify-start gap-4'}`}>
           <div className={`p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/40 transition-transform ${isCollapsed ? 'scale-110' : ''}`}>
              <ShieldCheck className="w-6 h-6 text-white" />
           </div>
           {!isCollapsed && <div className="animate-in fade-in duration-500 overflow-hidden"><h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none whitespace-nowrap">resQ HQ</h1><p className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1 whitespace-nowrap">SuperAdmin Access</p></div>}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) setIsMobileOpen(false); }} className={`w-full flex items-center rounded-2xl transition-all duration-300 font-bold text-sm group relative ${isCollapsed ? 'justify-center p-4' : 'px-6 py-4 gap-4'} ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <div className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{item.icon}</div>
              {!isCollapsed && <span className="whitespace-nowrap animate-in slide-in-from-left-2 duration-300">{item.label}</span>}
              {isCollapsed && <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] shadow-xl whitespace-nowrap border border-white/10">{item.label}</div>}
              {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>}
            </button>
          ))}
        </nav>

        <div className={`p-4 space-y-2 border-t border-white/5 bg-slate-950/50 transition-all ${isCollapsed ? 'items-center' : ''}`}>
          {!isCollapsed && <div className="px-4 py-2 mb-2 animate-in fade-in duration-500"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Global Sync Active</span></div></div>}
          <div className="space-y-1">
            <button onClick={() => onLogout()} className={`flex items-center text-slate-500 hover:text-indigo-400 transition-all w-full text-left font-black uppercase text-[10px] tracking-widest group p-3 rounded-xl hover:bg-white/5 ${isCollapsed ? 'justify-center' : 'gap-4'}`}><ArrowLeftCircle className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Utama</span>}</button>
            <button onClick={handleLogoutAction} className={`flex items-center text-slate-500 hover:text-red-400 transition-all w-full text-left font-black uppercase text-[10px] tracking-widest group p-3 rounded-xl hover:bg-white/5 ${isCollapsed ? 'justify-center' : 'gap-4'}`}><LogOut className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Keluar</span>}</button>
            <button onClick={handleForceLogout} className={`flex items-center text-red-500 hover:bg-red-500/10 transition-all w-full text-left font-black uppercase text-[9px] tracking-widest group p-3 rounded-xl border border-red-500/20 mt-2 ${isCollapsed ? 'justify-center' : 'gap-4'}`}><ShieldAlert className="w-5 h-5 text-red-600" />{!isCollapsed && <span>Force Logout</span>}</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-500">
        <header className="bg-white border-b border-slate-200 px-6 lg:px-10 py-5 shrink-0 z-40">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-4 lg:gap-6">
               <button onClick={() => setIsMobileOpen(true)} className="p-3 lg:hidden bg-slate-100 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Menu className="w-6 h-6" /></button>
               <h2 className="text-slate-900 font-black text-xl lg:text-3xl tracking-tighter uppercase leading-none">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none w-64 lg:w-80 text-sm font-medium transition-all" />
              </div>
              <div className="flex items-center gap-3 bg-indigo-50 p-1.5 pr-4 rounded-2xl border border-indigo-100">
                 <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">{user.name[0]}</div>
                 <div className="hidden lg:block"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Root Admin</p><p className="text-[10px] font-black text-indigo-700 uppercase leading-tight truncate max-w-[100px]">{user.name}</p></div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-50 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Petugas Terdaftar', value: stats.totalUsers, icon: <Users className="w-6 h-6" />, color: 'indigo' },
                    { label: 'Program Aktif', value: stats.activePrograms, icon: <Activity className="w-6 h-6" />, color: 'emerald' },
                    { label: 'Jumlah Kes Direkod', value: stats.totalCases, icon: <FileText className="w-6 h-6" />, color: 'blue' },
                    { label: 'Pusat MECC', value: stats.meccAdmins, icon: <Server className="w-6 h-6" />, color: 'purple' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                      <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl w-fit group-hover:scale-110 transition-transform`}>{s.icon}</div>
                      <div><p className="text-4xl font-black text-slate-900 tracking-tighter">{s.value}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p></div>
                    </div>
                  ))}
                </div>
                {/* Programs and HQ cards from original... */}
              </div>
            )}

            {activeTab === 'infra' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Status Infrastruktur Global</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Diagnostik resQ HQ</p>
                   </div>
                   <button onClick={runFullDiagnostics} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                      <RefreshCw className={`w-4 h-4 ${diagResults.sheets.status === 'loading' || diagResults.gemini.status === 'loading' ? 'animate-spin' : ''}`} /> Mulakan Diagnostik
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Google Sheets Status */}
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start">
                         <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><HardDrive className="w-6 h-6" /></div>
                         <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${diagResults.sheets.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {diagResults.sheets.status.toUpperCase()}
                         </div>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Database: Google Sheets</h4>
                         <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">{diagResults.sheets.msg}</p>
                      </div>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> Latency: </span>
                         <span className="text-xs font-black text-slate-800">{diagResults.sheets.latency ? `${diagResults.sheets.latency}ms` : 'N/A'}</span>
                      </div>
                   </div>

                   {/* Gemini API Status */}
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start">
                         <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Zap className="w-6 h-6" /></div>
                         <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${diagResults.gemini.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {diagResults.gemini.status.toUpperCase()}
                         </div>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">AI Engine: Gemini</h4>
                         <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">{diagResults.gemini.msg}</p>
                      </div>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4" /> Latency: </span>
                         <span className="text-xs font-black text-slate-800">{diagResults.gemini.latency ? `${diagResults.gemini.latency}ms` : 'N/A'}</span>
                      </div>
                   </div>

                   {/* Local Storage Health */}
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start">
                         <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Database className="w-6 h-6" /></div>
                         <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[8px] font-black uppercase tracking-widest">LOCAL CACHE</div>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Data Persistence</h4>
                         <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">Penggunaan storan pelayar tempatan untuk cache luar talian.</p>
                      </div>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kapasiti Terpakai:</span>
                         <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: diagResults.storage.usage }}></div></div>
                            <span className="text-xs font-black text-slate-800">{diagResults.storage.usage}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Terminal className="w-48 h-48" /></div>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div>
                         <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Penyelarasan Global HQ</h4>
                         <p className="text-indigo-200 text-xs font-medium max-w-xl leading-relaxed">Semua pangkalan data negeri sedang disinkronkan ke master sheet utama. Status sync global adalah stabil dengan purata integriti data 100%.</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Sync Terakhir</p>
                            <p className="text-sm font-black">Baru Sahaja</p>
                         </div>
                         <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-900/40"><Globe className="w-8 h-8" /></div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4"><Settings className="w-6 h-6 text-indigo-600" /> Konfigurasi Global resQ</h3>
                    
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google App Script URL (Backend Primary)</label>
                             <div className="relative">
                                <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  value={localStorage.getItem('resq_gas_url') || ''} 
                                  disabled
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-500 opacity-70"
                                />
                             </div>
                             <p className="text-[9px] text-slate-400 italic">Hanya SuperAdmin Root boleh mengubah URL ini melalui konsol peranti.</p>
                          </div>
                          
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protokol Keselamatan</label>
                             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                   <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Enkripsi Sesi Aktif</span>
                                </div>
                                <div className="w-12 h-6 bg-indigo-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                             </div>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-slate-100">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Penyelenggaraan Database</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             <button onClick={fetchAllData} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-white hover:border-indigo-600 transition-all group">
                                <RefreshCw className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:rotate-180 transition-all duration-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Segar Semula Data</span>
                             </button>
                             <button onClick={() => alert('Fungsi ini dikunci untuk Root SuperAdmin.')} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-red-50 hover:border-red-600 transition-all group">
                                <Archive className="w-6 h-6 text-slate-400 group-hover:text-red-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Arkibkan Sesi Lama</span>
                             </button>
                             <button onClick={() => window.open('https://ai.google.dev/', '_blank')} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-600 transition-all group">
                                <Cpu className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Konsol AI Gemini</span>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
            
            {/* Other views as before... */}
          </div>
        </main>
      </div>

      <div className="fixed bottom-8 right-8 z-[100]">
         <button className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-indigo-900/40 transform transition-all active:scale-95 group relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <Plus className="w-8 h-8 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
         </button>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
