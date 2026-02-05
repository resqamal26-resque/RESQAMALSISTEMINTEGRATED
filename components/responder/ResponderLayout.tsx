
import React, { useState, useEffect } from 'react';
import { User, Attendance, Case } from '../../types';
import { Activity, FilePlus, Hospital, LogOut, Signal, Database, CheckCircle, Bell } from 'lucide-react';
import CaseReportForm from './CaseReportForm';
import CaseList from './CaseList';
import NearbyReferrals from './NearbyReferrals';
import { db } from '../../services/databaseService';

interface ResponderLayoutProps {
  user: User;
  onLogout: () => void;
  activeTask: Attendance;
}

const ResponderLayout: React.FC<ResponderLayoutProps> = ({ user, onLogout, activeTask }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cases, setCases] = useState<Case[]>([]);
  const [gpsStatus, setGpsStatus] = useState(false);
  const [dbStatus, setDbStatus] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    // Show login success
    showToast(`Log Masuk Berjaya! Petugas: ${user.name}`);
    
    const fetchCases = async () => {
      const allCases = await db.getCases(activeTask.programId);
      setCases(allCases.filter(c => c.responderName === user.name));
    };

    const watchId = navigator.geolocation.watchPosition(
      () => setGpsStatus(true),
      () => setGpsStatus(false)
    );

    fetchCases();
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTask.programId, user.name]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoutClick = () => {
    showToast('Log Keluar Berjaya...', 'info');
    setTimeout(onLogout, 800);
  };

  const handleCaseAdded = async () => {
    const allCases = await db.getCases(activeTask.programId);
    setCases(allCases.filter(c => c.responderName === user.name));
    setActiveTab('dashboard');
    showToast('Kes Berjaya Dilaporkan & Dihantar!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300 w-[90%] max-w-sm">
          <div className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border ${
            toast.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-slate-800 border-slate-700'
          } text-white`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <p className="font-bold text-xs">{toast.message}</p>
          </div>
        </div>
      )}

      <header className="bg-red-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="font-black text-lg tracking-tight">resQ Responder</h1>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">{activeTask.checkpoint}</p>
          </div>
          <div className="flex items-center gap-3">
            <Signal className={`w-4 h-4 ${gpsStatus ? 'text-green-300' : 'text-slate-400'}`} />
            <Database className={`w-4 h-4 ${dbStatus ? 'text-green-300' : 'text-slate-400'}`} />
            <button onClick={handleLogoutClick} className="p-1 hover:bg-red-700 rounded transition-colors ml-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 flex-1">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h2 className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Ringkasan Tugas Hari Ini</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-3xl font-black text-slate-900">{cases.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Jumlah Kes</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-sm font-black text-slate-900">{new Date(activeTask.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Check-in Tugas</p>
                </div>
              </div>
            </div>
            
            <CaseList cases={cases} />
          </div>
        )}

        {activeTab === 'report' && (
          <CaseReportForm user={user} activeTask={activeTask} onCaseAdded={handleCaseAdded} />
        )}

        {activeTab === 'referral' && (
          <NearbyReferrals />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around py-2 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-red-600' : 'text-slate-400'}`}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
        </button>
        <button 
          onClick={() => setActiveTab('report')}
          className={`flex flex-col items-center gap-1 p-4 -mt-12 bg-red-600 rounded-full text-white shadow-2xl shadow-red-300 border-[6px] border-white transition-transform active:scale-90`}
        >
          <FilePlus className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setActiveTab('referral')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'referral' ? 'text-red-600' : 'text-slate-400'}`}
        >
          <Hospital className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Maps</span>
        </button>
      </nav>
    </div>
  );
};

export default ResponderLayout;
