
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserCircle, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  User as UserIcon, 
  Lock,
  ArrowRight,
  ShieldAlert,
  Users,
  ShieldAlert as ShieldAlertIcon,
  FlaskConical,
  Crown,
  MousePointer2,
  Sparkles,
  Info
} from 'lucide-react';
import { db } from '../services/databaseService';
import { User, UserRole, Program } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [credential, setCredential] = useState(''); 
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Sila pilih peranan anda terlebih dahulu.');
      return;
    }
    setError('');

    const users = await db.getUsers();
    const user = users.find(u => u.id === id.trim().toUpperCase());

    if (!user) {
      setError('ID Pengguna tidak dijumpai. Sila daftar atau semak semula ID anda.');
      return;
    }

    if (user.role !== selectedRole) {
      setError(`ID ini didaftarkan sebagai ${user.role}, bukan ${selectedRole}.`);
      return;
    }

    if (selectedRole === UserRole.RESPONDER) {
      if (user.name.toLowerCase() !== credential.trim().toLowerCase()) {
        setError('Nama tidak sepadan dengan rekod ID Responder ini.');
        return;
      }
    } else {
      if (user.password !== credential) {
        setError('Kata laluan salah.');
        return;
      }
    }

    onLogin(user);
    if (user.role === UserRole.RESPONDER) {
      navigate('/checkin');
    } else {
      navigate('/');
    }
  };

  const handleFastLogin = async (role: UserRole) => {
    const users = await db.getUsers();
    let testUser = users.find(u => u.role === role);
    
    // Auto-create test user if not exists
    if (!testUser) {
      const idPrefix = role === UserRole.MECC ? 'MECC' : role === UserRole.SUPERADMIN ? 'SA' : 'RES';
      const dummyId = `${idPrefix}_DEMO_${Math.floor(Math.random()*9000)+1000}`;
      testUser = {
        id: dummyId,
        name: `Ahmad ${role} (Demo)`,
        role: role,
        state: role === UserRole.SUPERADMIN ? 'Global' : 'Selangor',
        password: 'password',
        createdAt: new Date().toISOString()
      };
      await db.addUser(testUser);
    }

    // Ensure at least one active program for the demo state (Selangor)
    if (testUser.state === 'Selangor') {
      const programs = await db.getPrograms('Selangor');
      const activeProgram = programs.find(p => p.status === 'Active');
      
      if (!activeProgram) {
        if (programs.length > 0) {
          // Activate the first existing program found
          await db.updateProgram({ ...programs[0], status: 'Active' });
        } else {
          // Create a fresh demo program
          const today = new Date();
          const demoProgram: Program = {
            id: `PROG_DEMO_${Date.now().toString().slice(-4)}`,
            name: "Larian Demo resQ Selangor",
            date: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
            time: "08:00",
            location: "Dataran Merdeka (Demo)",
            state: "Selangor",
            status: 'Active',
            checkpoints: [],
            ambulances: []
          };
          await db.addProgram(demoProgram);
        }
      }
    }

    onLogin(testUser);
    if (testUser.role === UserRole.RESPONDER) {
      navigate('/checkin');
    } else {
      navigate('/');
    }
  };

  const roles = [
    { value: UserRole.RESPONDER, label: 'Responder', icon: <UserCircle className="w-5 h-5" />, desc: 'Petugas lapangan' },
    { value: UserRole.MECC, label: 'MECC Admin', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Pusat kawalan & Tetapan' },
    { value: UserRole.AJK, label: 'AJK Program', icon: <Users className="w-5 h-5" />, desc: 'Pengurusan aktiviti' },
    { value: UserRole.PIC, label: 'PIC Checkpoint', icon: <ShieldAlertIcon className="w-5 h-5" />, desc: 'Penyelia lokasi' },
    { value: UserRole.SUPERADMIN, label: 'Super Admin', icon: <Crown className="w-5 h-5" />, desc: 'Kawal selia sistem penuh' },
  ];

  const currentRoleObj = roles.find(r => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      <div className="max-w-md w-full flex flex-col gap-6 relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div className={`py-12 px-8 text-center relative overflow-hidden transition-colors duration-500 ${selectedRole === UserRole.SUPERADMIN ? 'bg-indigo-700' : 'bg-red-600'}`}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
              {selectedRole === UserRole.SUPERADMIN ? <Crown className="w-24 h-24 text-white fill-white" /> : <Zap className="w-24 h-24 text-white fill-white" />}
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-1 relative z-10 italic">resQ Amal</h1>
            <p className="text-red-100 font-bold text-[10px] uppercase tracking-[0.4em] opacity-90 relative z-10">Emergency Management Protocol</p>
          </div>

          <div className="p-8 md:p-12">
            {!showDemoAccess ? (
              <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="relative w-full text-center">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between p-6 bg-slate-50 border rounded-3xl transition-all duration-300 ${
                      isDropdownOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500 bg-white shadow-xl' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-all ${selectedRole ? (selectedRole === UserRole.SUPERADMIN ? 'bg-indigo-600' : 'bg-red-600') + ' text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {currentRoleObj ? currentRoleObj.icon : <UserIcon className="w-6 h-6" />}
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-sm uppercase tracking-tight ${selectedRole ? 'text-slate-800' : 'text-slate-500'}`}>
                          {selectedRole ? currentRoleObj?.label : 'Pilih Peranan'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-[110%] left-0 right-0 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {roles.map((role) => (
                          <button
                            key={role.value}
                            onClick={() => {
                              setSelectedRole(role.value);
                              setIsDropdownOpen(false);
                              setError('');
                            }}
                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                          >
                            <div className={`p-3 rounded-2xl ${selectedRole === role.value ? (role.value === UserRole.SUPERADMIN ? 'bg-indigo-600' : 'bg-red-600') + ' text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {role.icon}
                            </div>
                            <div>
                              <p className={`font-black text-sm ${selectedRole === role.value ? (role.value === UserRole.SUPERADMIN ? 'text-indigo-700' : 'text-red-700') : 'text-slate-700'}`}>
                                {role.label}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{role.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ID Pengguna</label>
                      <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value.toUpperCase())}
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-mono font-bold text-slate-800 text-lg"
                        placeholder="CTH: RES_9999"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                        {selectedRole === UserRole.RESPONDER ? "Pengesahan Nama Penuh" : "Kata Laluan Pintar"}
                      </label>
                      <div className="relative">
                        <input
                          type={selectedRole === UserRole.RESPONDER ? "text" : "password"}
                          value={credential}
                          onChange={(e) => setCredential(e.target.value)}
                          className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-800"
                          placeholder={selectedRole === UserRole.RESPONDER ? "Nama Anda" : "••••••••"}
                          required
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                          {selectedRole === UserRole.RESPONDER ? <UserIcon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-600 text-[10px] font-black bg-red-50 p-5 rounded-[1.5rem] border border-red-100 flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full text-white font-black py-6 rounded-[2rem] shadow-2xl transform transition-all active:scale-95 flex items-center justify-center gap-4 text-2xl ${selectedRole === UserRole.SUPERADMIN ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                  >
                    Log Masuk
                    <ArrowRight className="w-8 h-8" />
                  </button>
                </form>

                <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                  <button 
                    onClick={() => setShowDemoAccess(true)}
                    className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 group-hover:animate-pulse" />
                    Pusat Akses Demo
                  </button>
                  <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Tiada akaun? Sila hubungi MECC HQ
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FlaskConical className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Akses Pantas</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Log masuk satu-klik untuk tujuan demonstrasi</p>
                </div>

                <div className="space-y-4">
                  {[
                    { role: UserRole.SUPERADMIN, title: 'Global Root', icon: <Crown className="w-6 h-6" />, color: 'indigo', desc: 'Kawalan HQ Global' },
                    { role: UserRole.MECC, title: 'Admin MECC', icon: <ShieldCheck className="w-6 h-6" />, color: 'red', desc: 'Kawalan Program Negeri' },
                    { role: UserRole.RESPONDER, title: 'Responder', icon: <UserCircle className="w-6 h-6" />, color: 'green', desc: 'Akses Lapangan Unit' },
                  ].map((demo) => (
                    <button 
                      key={demo.role}
                      onClick={() => handleFastLogin(demo.role)}
                      className={`w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] flex items-center gap-6 hover:border-${demo.color}-500 hover:bg-${demo.color}-50/50 group transition-all text-left shadow-sm`}
                    >
                      <div className={`p-4 bg-${demo.color}-600 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                        {demo.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-black text-slate-800 uppercase text-sm group-hover:text-${demo.color}-700 transition-colors`}>{demo.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{demo.desc}</p>
                      </div>
                      <MousePointer2 className={`w-5 h-5 text-slate-200 group-hover:text-${demo.color}-500 group-hover:translate-x-1 transition-all`} />
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setShowDemoAccess(false)}
                  className="w-full py-5 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] hover:text-slate-900 transition-colors bg-slate-50 rounded-[2rem] flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Kembali ke Log Masuk Manual
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-10 text-center animate-blink-highlight">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em] leading-loose">
            resQ Amal Tactical Medical • v2.5 Stable <br/>
            Secure Communication Protocols Enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
