import React, { useRef, useEffect } from 'react';
import { Clock, Info, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

const AlertLog = ({ alerts }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when a new alert is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [alerts]);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          border: 'border-l-rose-600',
          text: 'text-rose-500',
          bg: 'bg-rose-500/10',
          icon: <XCircle className="w-3 h-3 text-rose-500" />
        };
      case 'WARNING':
        return {
          border: 'border-l-amber-500',
          text: 'text-amber-500',
          bg: 'bg-amber-500/10',
          icon: <AlertTriangle className="w-3 h-3 text-amber-500" />
        };
      case 'INFO':
      default:
        return {
          border: 'border-l-cyan-500',
          text: 'text-cyan-500',
          bg: 'bg-cyan-500/10',
          icon: <Info className="w-3 h-3 text-cyan-500" />
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Scrollable Alert List */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4"
      >
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 grayscale py-12">
            <div className="w-10 h-10 rounded-full border border-rose-500/30 flex items-center justify-center animate-pulse">
               <div className="w-2 h-2 bg-rose-500 rounded-full" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-200">SCANNING BUFFER...</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            return (
              <div 
                key={alert.id}
                className={`group relative flex flex-col gap-2 p-4 rounded-xl border border-white/5 border-l-2 bg-slate-900/40 hover:bg-slate-900/60 transition-all ${styles.border}`}
              >
                <div className="flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2.5">
                    {styles.icon}
                    <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-mono tabular-nums tracking-tighter italic">
                      {alert.timestamp}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-white/90 tracking-tight leading-relaxed selection:bg-rose-500/30 uppercase">
                  {alert.message}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                    Src: {alert.source}
                  </div>
                </div>
                
                {/* Visual Glitch Detail */}
                <div className="absolute top-0 right-0 w-24 h-[1px] opacity-0 group-hover:opacity-40 transition-opacity bg-gradient-to-l from-transparent to-cyan-500" />
              </div>
            );
          })
        )}
      </div>

      {/* Footer count */}
      <div className="px-6 py-2.5 bg-black/40 border-t border-white/5 flex justify-between">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Total_Detected: {alerts.length}
        </span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Status_Monitored
        </span>
      </div>
    </div>
  );
};

export default AlertLog;
