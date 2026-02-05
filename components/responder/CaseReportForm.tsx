
import React, { useState, useEffect } from 'react';
import { Send, MapPin, User as UserIcon, Activity, FilePlus, Share2, Clock, Thermometer, Droplets, HeartPulse, UserCheck, MessageCircle } from 'lucide-react';
import { db } from '../../services/databaseService';
import { User, Attendance, Case, Notification } from '../../types';

interface CaseReportFormProps {
  user: User;
  activeTask: Attendance;
  onCaseAdded: () => void;
}

const CaseReportForm: React.FC<CaseReportFormProps> = ({ user, activeTask, onCaseAdded }) => {
  // State for all requested fields
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Lelaki');
  const [complaint, setComplaint] = useState('');
  const [consciousness, setConsciousness] = useState('Alert (Sedar)');
  const [bp, setBp] = useState('');
  const [pr, setPr] = useState('');
  const [temp, setTemp] = useState('');
  const [dxt, setDxt] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medicName, setMedicName] = useState(user.name);
  const [startTime, setStartTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('Stabil');
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedCase, setLastSavedCase] = useState<Case | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.error("GPS error")
    );
  }, []);

  const generateWhatsAppTemplate = (data: Case) => {
    const text = `
🚀 *RESQ AMAL - LAPORAN KES* 🚀

🆔 *ID Kes:* ${data.id.slice(-6)}
📅 *Waktu:* ${new Date(data.timestamp).toLocaleString()}
👤 *Petugas:* ${data.responderName}
📍 *Program:* ${activeTask.programId} (@${data.checkpoint})

👤 *DATA PESAKIT:*
- *Nama:* ${data.patientName}
- *Umur:* ${data.age}
- *Jantina:* ${data.gender}

🚑 *PENILAIAN KLINIKAL:*
- *Aduan:* ${data.complaint}
- *Kesedaran:* ${data.consciousness}
- *Vital Sign:* 
  • BP: ${data.bp || 'N/A'}
  • PR: ${data.pr || 'N/A'} bpm
  • Temp: ${data.temp || 'N/A'}°C
  • DXT: ${data.dxt || 'N/A'} mmol/L

🛠 *RAWATAN:*
- *Tindakan:* ${data.treatment}
- *Masa:* ${data.startTime} - ${data.endTime || 'Semasa'}
- *Perawat:* ${data.medicName}

✅ *STATUS AKHIR:* *${data.status.toUpperCase()}*
📍 *GPS:* ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}
🔗 maps.google.com/?q=${data.latitude},${data.longitude}

_Dihantar melalui resQ Amal System_
    `.trim();
    return encodeURIComponent(text);
  };

  const handleWhatsAppShare = () => {
    if (!lastSavedCase) return;
    const url = `https://wa.me/?text=${generateWhatsAppTemplate(lastSavedCase)}`;
    window.open(url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return alert("Lokasi GPS diperlukan!");
    
    setIsSubmitting(true);
    const newCase: Case = {
      id: `CASE_${Date.now()}`,
      programId: activeTask.programId,
      responderName: user.name,
      checkpoint: activeTask.checkpoint,
      patientName,
      age,
      gender,
      complaint,
      consciousness,
      bp,
      pr,
      temp,
      dxt,
      treatment,
      medicName,
      startTime,
      endTime: endTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date().toISOString()
    };

    await db.addCase(newCase);
    
    const notification: Notification = {
      id: `NOTIF_${Date.now()}`,
      programId: activeTask.programId,
      senderName: user.name,
      message: `Kes Baru: ${patientName} (${status}) di ${activeTask.checkpoint}`,
      timestamp: new Date().toISOString(),
      type: 'case'
    };
    await db.addNotification(notification);

    setLastSavedCase(newCase);
    setIsSubmitting(false);
    // Not calling onCaseAdded immediately so user can share to WhatsApp first
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
      <Icon className="w-5 h-5 text-red-600" />
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{title}</h3>
    </div>
  );

  if (lastSavedCase) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-green-100 animate-in zoom-in-95 duration-500 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Laporan Berjaya</h2>
        <p className="text-slate-500 text-sm mb-8 font-medium italic">Data telah disinkronkan ke Cloud & Database.</p>
        
        <div className="space-y-4">
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 text-lg transition-all"
          >
            <MessageCircle className="w-6 h-6" />
            Hantar ke WhatsApp
          </button>
          
          <button
            onClick={() => onCaseAdded()}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-3xl text-xs uppercase tracking-widest transition-all"
          >
            Selesai & Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
          <FilePlus className="w-7 h-7 text-red-600" />
          Laporan Kes
        </h2>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Program</p>
          <p className="text-xs font-black text-red-600">{activeTask.programId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Patient Info */}
        <section>
          <SectionTitle icon={UserIcon} title="Maklumat Pesakit" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pesakit / ID</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold"
                placeholder="cth: Ahmad / P-001"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Umur</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold"
                  placeholder="25"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jantina</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold appearance-none"
                >
                  <option>Lelaki</option>
                  <option>Perempuan</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Info */}
        <section>
          <SectionTitle icon={Activity} title="Penilaian Klinikal" />
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Aduan / Simptom</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold min-h-[100px]"
                placeholder="Sila nyatakan simptom utama..."
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahap Kesedaran</label>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold"
              >
                <option>Alert (Sedar)</option>
                <option>Verbal (Respon Suara)</option>
                <option>Pain (Respon Sakit)</option>
                <option>Unresponsive (Tiada Respon)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><HeartPulse className="w-3 h-3"/> BP</label>
                <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Activity className="w-3 h-3"/> PR (bpm)</label>
                <input type="number" value={pr} onChange={(e) => setPr(e.target.value)} placeholder="80" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Thermometer className="w-3 h-3"/> Temp (°C)</label>
                <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.5" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Droplets className="w-3 h-3"/> DXT</label>
                <input type="number" step="0.1" value={dxt} onChange={(e) => setDxt(e.target.value)} placeholder="5.6" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Info */}
        <section>
          <SectionTitle icon={Clock} title="Rawatan & Masa" />
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rawatan Diberikan</label>
              <textarea
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none font-bold min-h-[80px]"
                placeholder="cth: Wound cleaning, nebulizer..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perawat</label>
                <input type="text" value={medicName} onChange={(e) => setMedicName(e.target.value)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Masa Mula</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Masa Akhir</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final Status */}
        <section>
          <SectionTitle icon={UserCheck} title="Status Akhir" />
          <div className="grid grid-cols-3 gap-3">
            {['Stabil', 'Rawatan', 'Rujuk'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
                  status === s 
                    ? 'border-red-600 bg-red-50 text-red-600' 
                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Koordinat GPS</p>
              <p className="text-[10px] font-mono font-bold">
                {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Mencari isyarat...'}
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !location}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-red-200 flex items-center justify-center gap-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <Send className="w-7 h-7" />
          {isSubmitting ? 'Menghantar...' : 'Simpan Laporan'}
        </button>
      </form>
    </div>
  );
};

export default CaseReportForm;
