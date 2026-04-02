import React, { useState } from 'react';
import { 
  LayoutGrid, List, Maximize2, ExternalLink, Copy, 
  Activity, Battery, Shield, Radio, ChevronDown 
} from 'lucide-react';
import { useSystemState } from '../context/SystemContext';
import YoloScanner from './YoloScanner';

const FeedsView = () => {
  const { setCurrentActiveDroneSource } = useSystemState();
  const [viewMode, setViewMode] = useState('grid');
  const [activeDroneId, setActiveDroneId] = useState('Responder 1');
  const [fullscreenDrone, setFullscreenDrone] = useState(null);

  // Drone fleet data
  const drones = [
    { id: 'Responder 1', battery: '84%', alt: '198ft', status: 'LIVE', type: 'SWAT Lemur' },
    { id: 'SWAT Lemur 2', battery: '92%', alt: '210ft', status: 'LIVE', type: 'Patrol' },
    { id: 'SWAT Lemur 3', battery: '45%', alt: '150ft', status: 'LIVE', type: 'SWAT Lemur' },
    { id: 'Responder 2', battery: '12%', alt: '0ft', status: 'DOCK', type: 'Responder' },
    { id: 'SWAT Lemur 2B', battery: '76%', alt: '300ft', status: 'LIVE', type: 'SWAT Lemur' },
    { id: 'Patrol Lemur 3', battery: '88%', alt: '180ft', status: 'LIVE', type: 'Patrol' },
    { id: 'SWAT Lemur 3C', battery: '100%', alt: '0ft', status: 'STANDBY', type: 'SWAT Lemur' },
    { id: 'Responder 3', battery: '62%', alt: '410ft', status: 'LIVE', type: 'Responder' },
    { id: 'Patrol Lemur 1', battery: '95%', alt: '205ft', status: 'LIVE', type: 'Patrol' },
  ];

  const handleFocus = (drone) => {
    setFullscreenDrone(drone);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14] text-[#94A3B8] font-sans overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white tracking-tight flex items-center gap-2">
            Drones online: <span className="bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full text-xs font-bold">9</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#27272A] text-white shadow-lg' : 'hover:text-white'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#27272A] text-white shadow-lg' : 'hover:text-white'}`}>
              <List size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 border border-white/20" />
            <span className="text-sm font-medium text-white hidden sm:block">Aayush Aade</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* LIST CONTAINER FIX: w-full max-w-5xl mx-auto flex flex-col gap-3 */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "w-full max-w-5xl mx-auto flex flex-col gap-3"}>
          {drones.map((drone, index) => (
            <div 
              key={drone.id} 
              onMouseEnter={() => setActiveDroneId(drone.id)} 
              className={`group relative rounded-lg overflow-hidden border bg-[#18181B] transition-all duration-300 ${viewMode === 'grid' ? 'aspect-video' : 'p-4 flex items-center w-full'} ${activeDroneId === drone.id ? 'border-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'border-white/5'}`}
            >
              
              {/* === GRID VIEW UI === */}
              {viewMode === 'grid' ? (
                <>
                  <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#0B0E14]">
                    {/* ONLY PLAY VIDEO FOR TILE 0 */}
                    {index === 0 ? (
                      <YoloScanner videoSrc="/video/cctv/14737129_3840_2160_50fps.mp4" />
                    ) : (
                      /* STANDBY TEXT FOR TILES 1-8 */
                      <span className="text-zinc-700 font-bold tracking-[0.5em] text-2xl uppercase">STANDBY</span>
                    )}
                  </div>
                  
                  <div className="absolute inset-0 z-10 p-3 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-start pointer-events-none">
                      <div className="flex items-center gap-2">
                        {drone.status === 'LIVE' && <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#00E5FF]" />}
                        <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider drop-shadow-md">{drone.id}</span>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <button className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 hover:bg-white/10 text-white"><Copy size={13}/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleFocus(drone); }} className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 hover:bg-[#00E5FF] hover:text-black text-white transition-colors"><Maximize2 size={13}/></button>
                        <button className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 hover:bg-white/10 text-white"><ExternalLink size={13}/></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end pointer-events-none">
                      <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tighter text-white/60">
                        <span className="flex items-center gap-1"><Battery size={12} className={drone.status === 'DOCK' ? 'text-red-500' : 'text-emerald-400'} /> {drone.battery}</span>
                        <span className="flex items-center gap-1"><Activity size={12} className="text-[#00E5FF]" /> {drone.alt}</span>
                      </div>
                      <div className="text-[8px] font-black text-white/20 uppercase italic tracking-[0.2em]">{drone.type}</div>
                    </div>
                  </div>
                </>
              ) : (

              /* === LIST VIEW UI === */
                <>
                  {/* COLUMN 1: ID */}
                  <div className="flex-1 flex items-center gap-4 relative z-10">
                    <div className={`w-2 h-2 rounded-full ${drone.status === 'LIVE' ? 'bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#00E5FF]' : 'bg-zinc-600'}`} />
                    <span className="text-sm font-bold text-white/90 uppercase tracking-wider">{drone.id}</span>
                  </div>
                  
                  {/* COLUMN 2: Telemetry */}
                  <div className="flex-1 flex justify-center gap-8 text-xs font-bold uppercase tracking-tighter text-white/60 relative z-10">
                    <span className="flex items-center gap-2 w-20"><Battery size={14} className={drone.status === 'DOCK' ? 'text-red-500' : 'text-emerald-400'} /> {drone.battery}</span>
                    <span className="flex items-center gap-2 w-20"><Activity size={14} className="text-[#00E5FF]" /> {drone.alt}</span>
                  </div>

                  {/* COLUMN 3: Actions */}
                  <div className="flex-1 flex justify-end items-center gap-4 relative z-10">
                    <span className="text-[10px] font-black text-white/20 uppercase italic tracking-[0.2em] hidden sm:block">{drone.type}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleFocus(drone); }} className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 hover:bg-[#00E5FF] hover:text-black text-white transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider"><Maximize2 size={13}/> Focus</button>
                  </div>
                </>
              )}

              {/* SHARED SCANLINE EFFECT */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
          ))}
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272A; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* FULLSCREEN INVESTIGATION MODAL */}
      {fullscreenDrone && (
        <div className="absolute inset-0 z-[100] bg-[#0B0E14] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="h-14 border-b border-white/10 bg-black/50 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#00E5FF]" />
              <span className="text-white font-bold tracking-[0.2em] uppercase text-sm">
                {fullscreenDrone.id} - ACTIVE INVESTIGATION
              </span>
            </div>
            <button 
              onClick={() => setFullscreenDrone(null)} 
              className="px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded text-xs font-bold tracking-widest uppercase transition-all"
            >
              Close Feed
            </button>
          </header>
          <div className="flex-1 relative bg-black">
            {/* Load YOLO Scanner with the selected drone's footage */}
            <YoloScanner 
              videoSrc={fullscreenDrone.id === 'Responder 1' 
                ? "/video/cctv/14737129_3840_2160_50fps.mp4" 
                : `/video/${fullscreenDrone.id.replace(/\s+/g, '_').toLowerCase()}.mp4`
              } 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedsView;