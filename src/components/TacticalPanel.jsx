import React from 'react';

const TacticalPanel = ({ title, children, icon: Icon, extra, className = "", headerStyle = "default" }) => (
  <div className={`bg-slate-950/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col ${className}`}>
    <div className={`h-11 border-b border-white/5 px-4 flex items-center justify-between shrink-0 ${headerStyle === 'alert' ? 'bg-red-500/5' : 'bg-white/5'}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-4 h-4 ${headerStyle === 'alert' ? 'text-red-500' : 'text-cyan-500'}`} />}
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/80">{title}</h3>
      </div>
      {extra}
    </div>
    <div className="flex-grow overflow-hidden relative">
      {children}
    </div>
  </div>
);

export default TacticalPanel;
