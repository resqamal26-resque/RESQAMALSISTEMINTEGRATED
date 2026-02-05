
import React from 'react';
import { Case } from '../../types';
import { Clock, MapPin, Activity, Thermometer, Droplets, HeartPulse, User } from 'lucide-react';
import { formatMyDate } from '../../App';

interface CaseListProps {
  cases: Case[];
}

const CaseList: React.FC<CaseListProps> = ({ cases }) => {
  if (cases.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Tiada rekod kes ditemui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Arkib Kes Bertugas</h2>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black">{cases.length} UNIT</span>
      </div>
      {cases.map((c) => (
        <div key={c.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-red-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                c.status === 'Stabil' ? 'bg-green-500 text-white' : 
                c.status === 'Rawatan' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {c.status}
              </span>
              <span className="text-[9px] font-black text-slate-300 uppercase">#{c.id.slice(-5)}</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{formatMyDate(c.timestamp)}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-slate-900 text-xl tracking-tighter uppercase">{c.patientName}</h3>
              <span className="text-[10px] font-black text-slate-400">({c.age}Y • {c.gender[0]})</span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{c.complaint}"</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">BP</p>
              <p className="text-[10px] font-black text-slate-800">{c.bp || '--'}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">PR</p>
              <p className="text-[10px] font-black text-slate-800">{c.pr || '--'}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">TEMP</p>
              <p className="text-[10px] font-black text-slate-800">{c.temp || '--'}°</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">DXT</p>
              <p className="text-[10px] font-black text-slate-800">{c.dxt || '--'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-5 border-t border-slate-50">
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <MapPin className="w-4 h-4 text-red-500" />
              {c.checkpoint}
            </div>
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <User className="w-4 h-4 text-indigo-500" />
              {c.medicName.split(' ')[0]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CaseList;
