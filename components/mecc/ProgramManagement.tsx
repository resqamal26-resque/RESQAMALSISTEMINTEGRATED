
import React, { useState, useEffect } from 'react';
import { Program, User, CheckpointDetail, AmbulanceDetail } from '../../types';
import { db } from '../../services/databaseService';
import { Calendar, MapPin, X, Edit3, Save, Power, Archive, Clock, Beaker } from 'lucide-react';
import { formatMyDate } from '../../App';

interface ProgramManagementProps {
  user: User;
}

const ProgramManagement: React.FC<ProgramManagementProps> = ({ user }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [user.state]);

  const fetchPrograms = async () => {
    const all = await db.getPrograms(user.state);
    setPrograms(all);
  };

  const handleSave = async () => {
    if (editingProgram) {
      await db.updateProgram(editingProgram);
      setEditingProgram(null);
      fetchPrograms();
    }
  };

  const handleStatusChange = async (programId: string, newStatus: 'Active' | 'Inactive' | 'Completed') => {
    const all = await db.getPrograms(user.state);
    const updatedPrograms = all.map(p => {
      if (newStatus === 'Active') {
        return {
          ...p,
          status: p.id === programId ? 'Active' : (p.status === 'Active' ? 'Inactive' : p.status) as any
        };
      }
      if (p.id === programId) {
        return { ...p, status: newStatus };
      }
      return p;
    });

    for (const prog of updatedPrograms) {
      await db.updateProgram(prog);
    }
    fetchPrograms();
    alert(`Status program dikemaskini.`);
  };

  const generateSampleData = async () => {
    const id = `SMPL_${Date.now().toString().slice(-4)}`;
    
    // User requested format: dd/mm/yyyy
    const today = new Date();
    const formattedSampleDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const sample: Program = {
      id,
      name: "Acara Simulasi 2026",
      date: formattedSampleDate,
      time: "08:00",
      location: "Dataran Merdeka",
      state: user.state,
      status: 'Inactive',
      checkpoints: [
        {
          id: `CP_${Date.now()}_1`,
          callsign: "STESYEN 1",
          location: "Check-in",
          pic: "En. Zul",
          staff: ["Staff A", "Staff B"]
        }
      ],
      ambulances: [
        {
          id: `AMB_${Date.now()}_1`,
          callsign: "MEDIC 1",
          noPlate: "ABC 1234",
          location: "Base",
          pic: "Dr. Dan",
          crew: ["Driver X", "Paramedic Y"]
        }
      ]
    };

    await db.addProgram(sample);
    fetchPrograms();
    alert("Sampel data dd/mm/yyyy dijana!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tighter uppercase">Urus Program</h2>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.state} Region</span>
        </div>
        <button 
          onClick={generateSampleData}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 transition-all"
        >
          <Beaker className="w-4 h-4 text-purple-600" />
          Jana Sampel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {programs.map(p => (
          <div key={p.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border transition-all ${
            p.status === 'Active' ? 'border-green-200 ring-2 ring-green-50' : 'border-slate-100'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-5">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                  p.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1">{p.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-red-500"/> {p.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500"/> {p.time}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {p.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {p.status !== 'Active' ? (
                  <button onClick={() => handleStatusChange(p.id, 'Active')} className="px-5 py-2.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">Aktifkan</button>
                ) : (
                  <button onClick={() => handleStatusChange(p.id, 'Completed')} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Selesai</button>
                )}
                <button onClick={() => setEditingProgram({ ...p })} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingProgram && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Edit Program Info</h3>
              <button onClick={() => setEditingProgram(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 space-y-6 bg-slate-50">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tarikh (dd/mm/yyyy)</label>
                  <input 
                    type="text" 
                    value={editingProgram.date} 
                    onChange={e => setEditingProgram({...editingProgram, date: e.target.value})}
                    placeholder="Contoh: 5/2/2026"
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 font-bold" 
                  />
               </div>
               <button onClick={handleSave} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl hover:bg-red-700">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;
