import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle, ShieldCheck, UserCircle, Users, ShieldAlert } from 'lucide-react';
import { MALAYSIAN_STATES } from '../constants';
import { db } from '../services/databaseService';
import { User, UserRole } from '../types';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RESPONDER);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedState = MALAYSIAN_STATES.find(s => s.name === state);
    if (!selectedState) return;

    const timestamp = Date.now().toString().slice(-4);
    const abbr = selectedState.abbr;
    
    // Auto-generate IDs based on role
    let prefix = 'RES';
    if (role === UserRole.MECC) prefix = 'MECC';
    if (role === UserRole.AJK) prefix = 'AJK';
    if (role === UserRole.PIC) prefix = 'PIC';
    
    const mainId = `${prefix}_${abbr}_${timestamp}`;

    const newUser: User = {
      id: mainId,
      name,
      role,
      state,
      password: role !== UserRole.RESPONDER ? password : '',
      createdAt: new Date().toISOString()
    };

    await db.addUser(newUser);
    setGeneratedIds([mainId]);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Pendaftaran Berjaya!</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Sila simpan ID unik anda di bawah untuk log masuk ke sistem resQ Amal.</p>
          
          <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mb-2">ID PENGGUNA ANDA</p>
            {generatedIds.map(id => (
              <p key={id} className="text-3xl font-mono font-black text-red-600 tracking-tighter">{id}</p>
            ))}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2"
          >
            Log Masuk Sekarang
          </button>
        </div>
      </div>
    );
  }

  const roleOptions = [
    { value: UserRole.RESPONDER, label: 'Responder', icon: <UserCircle className="w-4 h-4" /> },
    { value: UserRole.MECC, label: 'MECC', icon: <ShieldCheck className="w-4 h-4" /> },
    { value: UserRole.AJK, label: 'AJK', icon: <Users className="w-4 h-4" /> },
    { value: UserRole.PIC, label: 'PIC', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-red-600 px-10 py-10 relative overflow-hidden">
          <Link to="/login" className="text-red-100 hover:text-white flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Log Masuk
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tighter">Daftar Akaun Petugas</h1>
          <p className="text-red-100 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Sertai unit respon kecemasan resQ Amal</p>
        </div>

        <form onSubmit={handleRegister} className="p-10 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Kategori Peranan</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${
                    role === opt.value 
                      ? 'border-red-600 bg-red-50 text-red-600 shadow-md ring-4 ring-red-500/5' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nama Penuh</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold text-slate-800 transition-all"
                placeholder="cth: Ahmad Bin Abu"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Negeri Bertugas</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold text-slate-800 appearance-none transition-all"
                required
              >
                <option value="">-- Pilih Negeri --</option>
                {MALAYSIAN_STATES.map(s => (
                  <option key={s.abbr} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {role !== UserRole.RESPONDER && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Kata Laluan Sistem</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold text-slate-800 transition-all"
                placeholder="Mestilah sukar diteka"
                required
              />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-3xl shadow-2xl shadow-red-200 transform transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <UserPlus className="w-6 h-6" />
              Sahkan Pendaftaran
            </button>
            <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Akaun anda akan didaftarkan ke Master List Database secara automatik.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;