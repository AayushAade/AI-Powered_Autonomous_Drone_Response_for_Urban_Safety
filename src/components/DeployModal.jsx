import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Battery, Radio, Navigation } from 'lucide-react';

const DeployModal = ({ isOpen, onClose, onDeploy }) => {
  const drones = [
    { id: '3457TZ0001', name: 'Responder 01', dist: '4 miles away', status: 'Ready to fly', color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
    { id: '3457TZ0002', name: 'Responder 02', dist: '3 miles away', status: 'Charging', color: 'text-orange-500', bg: 'bg-orange-500/20' },
    { id: '3457TZ0003', name: 'Responder 03', dist: '1 miles away', status: 'Charging', color: 'text-orange-500', bg: 'bg-orange-500/20' },
    { id: '3457TZ0004', name: 'Responder 04', dist: '12 miles away', status: 'Ready to fly', color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-[440px] bg-[#121214] border border-[#27272a] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] text-white flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1">Deploy #2667(9)8B05DEY</h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Please select drone for the mission</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search for drones..." 
                  className="w-full bg-[#1a1a1d] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Drone List */}
            <div className="px-6 max-h-[280px] overflow-y-auto custom-scrollbar">
               <div className="space-y-3 pb-4">
                  {drones.map((drone, idx) => (
                    <div 
                      key={drone.id}
                      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${idx === 0 ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${idx === 0 ? 'border-cyan-500' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                         {idx === 0 && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-xs font-black text-white mb-0.5">{drone.name}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">ID: {drone.id}</div>
                        <div className="text-[10px] font-black text-cyan-400 mt-1">{drone.dist}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-[10px] font-black uppercase">
                         <div className="w-16 h-8 bg-zinc-900/50 rounded border border-white/5 overflow-hidden flex items-center justify-center">
                            <img src="https://img.freepik.com/premium-photo/military-drone-white-background-generative-ai_115919-6194.jpg?w=1000" className="opacity-40 invert scale-125" />
                         </div>
                         <div className={`${drone.bg} ${drone.color} px-2 py-0.5 rounded leading-none`}>
                           {drone.status}
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Location Check Box */}
            <div className="p-6 pt-2">
               <div className="bg-black/40 border border-[#27272a] rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 tactical-grid" />
                  <div className="relative z-10">
                     <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Check the location</div>
                     <div className="border border-red-500/60 bg-red-950/20 rounded-lg p-3 flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                           <Navigation className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                           <div className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-0.5">Alert Area</div>
                           <div className="text-[11px] font-bold text-zinc-400 leading-snug">6316 N 83rd St, Redmond, WA 98052, USA</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Button */}
            <div className="p-6 pt-0">
              <button 
                onClick={onDeploy}
                className="w-full bg-[#00e5ff] hover:bg-cyan-400 text-black font-black text-lg py-4 rounded-xl transition-all shadow-[0_20px_40px_rgba(0,229,255,0.2)] active:scale-95"
              >
                Deploy Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeployModal;