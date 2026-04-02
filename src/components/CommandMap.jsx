import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TacticalPanel from './TacticalPanel';
import { Crosshair, Grid, Layers, Maximize2, Phone, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom SVG Icons
const createDroneIcon = (color) => L.divIcon({
  className: 'custom-drone-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20"></div>
      <div class="w-8 h-8 rounded-full border border-cyan-400 bg-black/80 flex items-center justify-center shadow-[0_0_15px_${color}]">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><path d="M2 10h20"/><path d="m15 10-3 3-3-3"/><path d="M12 13v8"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const createAlertIcon = () => L.divIcon({
  className: 'custom-alert-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse"></div>
      <div class="w-8 h-8 rounded-full border border-red-500 bg-black/80 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const icons = {
  HUB: createDroneIcon('#00e5ff'),
  UNIT: createDroneIcon('#00ff00'),
  TARGET: createAlertIcon(),
};

// Component to sync map and handle RESIZE / INVALIDATE SIZE
const MapController = ({ center, zoom, isTactical }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  // CRITICAL: Fix for Leaflet Resize Bug
  useEffect(() => {
    // Small delay ensures the container has finished its CSS transition/reflow
    const timer = setTimeout(() => {
      map.invalidateSize();
      console.log("Map size invalidated for Tactical Mode:", isTactical);
    }, 100);
    return () => clearTimeout(timer);
  }, [isTactical, map]);

  return null;
};

const CommandMap = ({ mapState, isTactical = false, onDeployClick }) => {
  const { center, zoom, markers, paths } = mapState;

  // If NOT in tactical mode, wrap in TacticalPanel. If YES, just return the map content for the floating widget.
  const mapContent = (
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden">
      {/* 1. GLOBAL MAP OVERLAYS (z-40) */}
      {!isTactical && (
        <>
          <div className="absolute top-6 left-24 flex items-center gap-2 text-white/90 z-40 pointer-events-none">
            <Grid className="w-5 h-5 text-cyan-400" />
            <span className="text-xl font-bold tracking-tight">City View</span>
          </div>

          {/* Bottom Left Filters Widget */}
          <div className="absolute bottom-6 left-24 z-50 flex flex-col items-center gap-2 pointer-events-auto">
            <div className="bg-[#18181b]/80 backdrop-blur-md border border-[#27272a] rounded-xl p-3 flex flex-col items-center gap-3 shadow-2xl">
              <div className="w-16 h-12 bg-slate-800 rounded-md border border-slate-700 overflow-hidden relative shadow-inner">
                 <div className="absolute inset-0 opacity-40 tactical-grid" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
                 <div className="absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
                 <div className="absolute top-2/3 left-2/3 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
              </div>
              <button className="bg-[#27272a] hover:bg-slate-700 text-white rounded-md px-3 py-1.5 text-[10px] font-bold flex items-center gap-2 transition-colors">
                <Layers className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Bottom Right Controls */}
          <div className="absolute bottom-6 right-6 z-40 pointer-events-auto">
            <div className="bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-full px-5 py-2 flex items-center gap-5 shadow-2xl">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terrain</span>
                 <div className="w-9 h-5 bg-zinc-800 rounded-full relative p-1 cursor-pointer">
                    <div className="w-3 h-3 bg-zinc-400 rounded-full" />
                 </div>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button className="text-zinc-400 hover:text-white">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map Zoom Controls (Left) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 z-40 flex flex-col gap-2">
            <div className="bg-[#18181b]/90 backdrop-blur border border-[#27272a] rounded-lg p-1 flex flex-col">
              <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white">+</button>
              <div className="h-px bg-white/5 mx-1" />
              <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white">-</button>
            </div>
          </div>
        </>
      )}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        <MapController center={center} zoom={zoom} isTactical={isTactical} />

        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.pos} 
            icon={icons[marker.type] || icons.HUB}
          >
            {marker.type === 'TARGET' ? (
              <Popup className="tactical-popup custom-pop-red" maxWidth={300}>
                <div className="bg-[#18181b]/95 backdrop-blur-md border border-red-500/50 rounded-xl p-5 text-white shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <Phone className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                       <div className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-1">Incoming Alert</div>
                       <div className="text-sm font-black text-white">Case ID: 2667(9)8B05DEY</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-bold text-zinc-400 tabular-nums">47.6061° N, 122.3328° W</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-black text-zinc-600 uppercase mt-0.5">Addr:</div>
                      <div className="text-xs font-bold text-zinc-300 leading-relaxed">
                        6316 N 83rd St, Redmond, WA<br/>98052, USA
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                        console.log("MARKER DEPLOY CLICKED");
                        if (onDeployClick) onDeployClick();
                    }}
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  >
                    DEPLOY DRONE
                  </button>
                </div>
              </Popup>
            ) : (
              <Tooltip permanent direction="right" offset={[15, 0]} className="tactical-tooltip">
                <span className="tabular-nums">{marker.label}</span>
              </Tooltip>
            )}
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute inset-0 pointer-events-none z-[1] opacity-5 tactical-grid" />
    </div>
  );

  if (isTactical) {
    return mapContent;
  }

  return (
    <TacticalPanel title="Command View: Hub" icon={Crosshair} className="h-full relative">
      {mapContent}
    </TacticalPanel>
  );
};

export default CommandMap;
