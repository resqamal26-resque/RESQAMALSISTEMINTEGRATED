
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, LogOut, CheckCircle, ShieldAlert, AlertTriangle, PhoneCall } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Program, User, Attendance, Notification } from '../../types';
import { CHECKPOINTS } from '../../constants';

interface TaskCheckInProps {
  user: User;
  onTaskLogin: (task: Attendance) => void;
  onLogout: () => void;
}

const TaskCheckIn: React.FC<TaskCheckInProps> = ({ user, onTaskLogin, onLogout }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrograms = async () => {
      const activePrograms = await db.getPrograms(user.state);
      const filtered = activePrograms.filter(p => p.status === 'Active');
      setPrograms(filtered);
      setIsLoading(false);
    };

    // Request Geolocation immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setError('Sila benarkan akses GPS untuk meneruskan tugas.')
      );
    } else {
      setError('GPS tidak disokong pada peranti ini.');
    }

    fetchPrograms();
  }, [user.state]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError('Lokasi GPS diperlukan. Sila aktifkan GPS anda.');
      return;
    }

    const attendance: Attendance = {
      id: `ATT_${Date.now()}`,
      programId: selectedProgramId,
      responderId: user.id,
      responderName: user.name,
      checkpoint: selectedCheckpoint,
      entryTime: new Date().toISOString(),
      location
    };

    await db.addAttendance(attendance);

    // Create notification for MECC
    const notification: Notification = {
      id: `NOTIF_${Date.now()}`,
      programId: selectedProgramId,
      senderName: user.name,
      message: `${user.name} telah log masuk tugas di ${selectedCheckpoint}`,
      timestamp: new Date().toISOString(),
      type: 'attendance'
    };
    await db.addNotification(notification);

    onTaskLogin(attendance);
    navigate('/');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  const hasNoPrograms = programs.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-red-600 text-white p-6 shadow-lg">
        <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">Log Masuk Tugas</h1>
            <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Responder Identity: {user.id}</p>
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-red-700 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
          
          {hasNoPrograms ? (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50">
                <AlertTriangle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Tiada Program Aktif</h2>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-amber-800 leading-relaxed">
                    Sistem tidak menemui sebarang program yang aktif di negeri <span className="underline decoration-2">{user.state}</span> buat masa ini.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center gap-3 justify-center">
                  <PhoneCall className="w-5 h-5 text-red-500 animate-bounce" />
                  <p className="font-black text-xs uppercase tracking-widest">Tindakan Diperlukan</p>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-loose">
                  Sila hubungi <span className="text-white font-bold">PIC Checkpoint</span> atau <span className="text-white font-bold">Penyelaras MECC</span> program anda untuk mengaktifkan status program dalam sistem.
                </p>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                Cuba Segarkan Semula Laman
              </button>
            </div>
          ) : (
            <>
              {!location && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-800 animate-pulse">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <p className="text-xs font-black uppercase tracking-tight">Menunggu isyarat GPS... Sila benarkan akses lokasi pada pelayar anda.</p>
                </div>
              )}

              <form onSubmit={handleCheckIn} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pilih Program Aktif</label>
                    <div className="relative">
                      <select
                        value={selectedProgramId}
                        onChange={(e) => setSelectedProgramId(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none appearance-none font-bold text-slate-800 bg-slate-50"
                        required
                      >
                        <option value="">-- Pilih Program --</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Checkpoint Tugasan</label>
                    <div className="relative">
                      <select
                        value={selectedCheckpoint}
                        onChange={(e) => setSelectedCheckpoint(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none appearance-none font-bold text-slate-800 bg-slate-50"
                        required
                      >
                        <option value="">-- Pilih Checkpoint --</option>
                        {CHECKPOINTS.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-600 text-[10px] font-black uppercase bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

                <button
                  type="submit"
                  disabled={!location || !selectedProgramId || !selectedCheckpoint}
                  className={`w-full py-5 rounded-2xl text-white font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                    location ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-7 h-7" />
                  Sahkan Kehadiran
                </button>
              </form>

              <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-3 h-3 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  Status GPS: {location ? `Disambung (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Tiada Isyarat'}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      
      <div className="p-8 text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">
        resQ Amal • Tactical Medical Response Unit
      </div>
    </div>
  );
};

export default TaskCheckIn;
