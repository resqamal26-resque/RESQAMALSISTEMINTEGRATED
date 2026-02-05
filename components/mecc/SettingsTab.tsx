
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Database, 
  RefreshCw, 
  Users as UsersIcon, 
  Map as MapIcon,
  ArrowRight,
  Link as LinkIcon,
  Activity,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { googleSheetService } from '../../services/googleSheetService';
import { Program, User, UserRole } from '../../types';
import { formatMyDate } from '../../App';

interface SettingsTabProps {
  user: User;
}

const REQUIRED_STRUCTURE = {
  "Master_Users_List": ["id", "name", "role", "state", "createdAt", "spreadsheetId"],
  "Summary_Programs": ["id", "name", "location", "date", "time", "state", "status"],
  "Summary_Cases": ["id", "programId", "responderName", "checkpoint", "patientName", "complaint", "status", "timestamp", "latitude", "longitude"]
};

const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  if (user.role !== UserRole.MECC) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-red-200">
        <ShieldAlert className="w-16 h-16 text-red-600 mb-4" />
        <h3 className="text-xl font-black text-slate-800">Akses Dihalang</h3>
        <p className="text-slate-500 font-medium">Hanya Admin MECC yang dibenarkan mengakses tetapan sistem.</p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'users' | 'global_programs' | 'diagnostics'>('general');
  const [progName, setProgName] = useState('');
  const [progDate, setProgDate] = useState(''); // Stores yyyy-mm-dd from input
  const [progTime, setProgTime] = useState('');
  const [progLoc, setProgLoc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultGasUrl = 'https://script.google.com/macros/s/AKfycbzxTJSmAUVSNBhIFCnIXi5WMHeIqb9BhyeaBOm51REMZEl-nQDC4GlxZZRKXEjI3SWoqA/exec';
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('resq_gas_url') || defaultGasUrl);

  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResults, setDiagResults] = useState<{
    connection: 'idle' | 'success' | 'error';
    structure: 'idle' | 'success' | 'warning' | 'error';
    details: string[];
  }>({ connection: 'idle', structure: 'idle', details: [] });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'users' || activeSubTab === 'global_programs') {
      fetchAdminData();
    }
  }, [activeSubTab]);

  const fetchAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const [users, programs] = await Promise.all([
        db.getUsers(),
        db.getPrograms()
      ]);
      setAllUsers(users);
      setAllPrograms(programs);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleSaveGasUrl = () => {
    localStorage.setItem('resq_gas_url', gasUrl);
    alert('Konfigurasi Backend Berjaya Dikemaskini!');
  };

  const runDiagnostics = async () => {
    setDiagLoading(true);
    const results: typeof diagResults = { connection: 'idle', structure: 'idle', details: [] };
    const response = await googleSheetService.testConnection();
    if (response.status === 'success') {
      results.connection = 'success';
      results.details.push('✅ Sambungan berjaya.');
      results.structure = 'success';
    } else {
      results.connection = 'error';
      results.details.push('❌ Gagal menyambung.');
    }
    setDiagResults(results);
    setDiagLoading(false);
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    const id = `${yy}${mm}${random}`;

    // Convert from yyyy-mm-dd to dd/mm/yyyy for consistent system storage
    const formattedDate = formatMyDate(progDate);

    const newProgram: Program = {
      id,
      name: progName,
      date: formattedDate,
      time: progTime,
      location: progLoc,
      state: user.state,
      status: 'Active',
      checkpoints: [{ id: `CP_${Date.now()}`, callsign: 'STATION A', location: 'Entry', pic: '', staff: [] }],
      ambulances: [{ id: `AMB_${Date.now()}`, callsign: 'ALPHA', noPlate: '', location: 'Base', pic: '', crew: [] }]
    };

    await db.addProgram(newProgram);
    setIsSubmitting(false);
    setProgName('');
    setProgDate('');
    setProgTime('');
    setProgLoc('');
    alert('Program Baru Berjaya Diaktifkan!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'general', label: 'Backend', icon: <Database className="w-4 h-4" /> },
          { id: 'diagnostics', label: 'Ujian Sistem', icon: <Activity className="w-4 h-4" /> },
          { id: 'users', label: 'Petugas', icon: <UsersIcon className="w-4 h-4" /> },
          { id: 'global_programs', label: 'Global', icon: <MapIcon className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'general' && (
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-red-600" />
              Aktifkan Program Baru ({user.state})
            </h3>
            <form onSubmit={handleAddProgram} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Acara</label>
                <input type="text" value={progName} onChange={(e) => setProgName(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" placeholder="Larian Hijau" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tarikh</label>
                  <input type="date" value={progDate} onChange={(e) => setProgDate(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Masa</label>
                  <input type="time" value={progTime} onChange={(e) => setProgTime(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" required />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lokasi</label>
                <input type="text" value={progLoc} onChange={(e) => setProgLoc(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" placeholder="Stadium" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="md:col-span-2 bg-red-600 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? 'Memproses...' : 'Aktifkan Program'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'diagnostics' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
          <button onClick={runDiagnostics} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
            Uji Sambungan
          </button>
          <div className="bg-slate-900 rounded-[2rem] p-6 font-mono text-[11px] text-green-400 overflow-y-auto max-h-[300px]">
            {diagResults.details.map((line, i) => <p key={i} className="mb-1">{line}</p>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
