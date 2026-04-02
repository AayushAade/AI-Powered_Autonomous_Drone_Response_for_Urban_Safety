import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DroneSimulationMap from './DroneSimulationMap';
import { 
  Video, Grid, Crosshair, Users, Layers, MoreHorizontal, 
  ChevronDown, Phone, Shield, Radio, Signal, Battery, 
  Navigation, Plus, ChevronLeft, Mic, Target, Maximize, 
  Settings, Minus, Map as MapIcon, Camera, Disc, Thermometer,
  Wind, Cloud
} from 'lucide-react';

// 1. MiniMap Controls Component
const MiniMapControls = ({ toggleExpand, isExpanded }) => {
  const map = useMap();

  return (
    <>
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000] pointer-events-auto">
        <MapControlButton 
          icon={Target} 
          onClick={() => map.setView([18.5204, 73.8567], 15)}
          tooltip="Locate Asset"
        />
        <div className="flex flex-col bg-black/60 rounded-lg border border-white/10 overflow-hidden">
          <MapControlButton 
            icon={Plus} 
            onClick={() => map.zoomIn()}
            tooltip="Zoom In"
          />
          <div className="h-px bg-white/10 mx-1" />
          <MapControlButton 
            icon={Minus} 
            onClick={() => map.zoomOut()}
            tooltip="Zoom Out"
          />
        </div>
        <MapControlButton 
          icon={Navigation} 
          tooltip="Center Map"
        />
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
        <MapControlButton 
          icon={Maximize} 
          active={isExpanded}
          onClick={toggleExpand}
          tooltip={isExpanded ? "Minimize" : "Full View"} 
        />
      </div>

      <div className="absolute top-4 right-4 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <MapControlButton icon={Settings} />
      </div>

      {/* Location Pill logic moved inside for proper positioning over map */}
      <div className="absolute top-4 right-12 z-[1000] bg-black/80 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex gap-3 items-start shadow-2xl pointer-events-none">
        <div className="w-7 h-7 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center justify-center">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-white">Pune, MH</span>
          <span className="text-[10px] text-zinc-400 leading-tight">Sector 7 Command</span>
        </div>
      </div>
    </>
  );
};

const LiveDroneHUD = ({ onBack, caseId }) => {
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isDeployed, setIsDeployed] = useState(false); // New deployment state
  const [activeCamera, setActiveCamera] = useState('gimbal');
  const [activePayload, setActivePayload] = useState('L');
  const [isMicLive, setIsMicLive] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Real-Time Clock & WebRTC States
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const videoRef = useRef(null);
  const peerInstance = useRef(null);
  
  // New States for Telemetry and Media
  const [telemetry, setTelemetry] = useState({ 
    speed: 5, 
    alt: 200, 
    uptime: '00:12:54', 
    battery: 64, 
    eta: 'Calculating...', 
    signal: 28 
  });
  const [isRecording, setIsRecording] = useState(false);
  const [flash, setFlash] = useState(false);

  // 1. Real-Time Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Bulletproof PeerJS for React Strict Mode
  useEffect(() => {
    if (!peerInstance.current) {
      const peer = new Peer('skynetra-hub-01');
      peerInstance.current = peer;
      
      peer.on('open', (id) => {
        console.log('📡 Hub listening on ID:', id);
      });

      peer.on('call', (call) => {
        console.log('⚠️ Incoming drone transmission...');
        call.answer(); 
        
        call.on('stream', (remoteStream) => {
          console.log('✅ Video stream received!');
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
          }
        });

        call.on('error', (err) => {
          console.error('PeerJS Call Error:', err);
        });
      });
    }

    return () => {
      if (peerInstance.current) {
        peerInstance.current.disconnect();
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
    };
  }, []);

  // Added: Function to handle telemetry updates from the child map
  const handleTelemetryUpdate = (data) => {
    setTelemetry((prev) => ({
      ...prev,
      speed: data.speed,
      alt: data.alt,
      eta: data.eta || prev.eta,
    }));
  };

  const toggleRecording = () => { 
    setIsRecording(!isRecording); 
    console.log("Recording state:", !isRecording); 
  };

  const takeScreenshot = () => { 
    console.log("Screenshot captured and saved to local state.");
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  // Keyboard Listeners for R and P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'r') {
        toggleRecording();
      } else if (e.key.toLowerCase() === 'p') {
        takeScreenshot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]); // Include isRecording to ensure toggleRecording has fresh state access if needed

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none z-0">
      
      {/* 0. ACTUAL WEBRTC VIDEO FEED - ROOT LAYER */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover z-0 bg-neutral-900" 
      />

      {/* Mock Video Gradient / Scanlines Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-10 border border-white/5 pointer-events-none z-[1]" />
      <div className="absolute inset-0 pointer-events-none opacity-5 tactical-grid z-[1]" />
      
      {/* Flash Effect */}
      {flash && <div className="absolute inset-0 bg-white z-[100] opacity-80 transition-opacity" />}

      {/* 1. MAIN HUD CONTAINER (Left Padding removed, children use absolute positions) */}
      <div className="w-full h-full relative z-10">

        {/* 2. TOP NAVIGATION (z-40) - FIXED LEFT POSITION */}
        <div className="absolute top-6 left-6 flex items-center gap-6 z-40 pointer-events-auto">
          <span className="text-xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] italic uppercase">SkyNetra</span>
        </div>

        {/* Top Center: Telemetry & Weather Pills */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40">
          <div className="flex items-center gap-4 bg-black/80 backdrop-blur-md rounded-md border border-white/10 px-5 py-2.5 text-[11px] font-bold tabular-nums shadow-2xl transition-all">
            <div className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-zinc-500" /> S: <span className="text-cyan-400">{telemetry.speed} mph</span></div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-zinc-500" /> H: <span className="text-cyan-400">{telemetry.alt} ft</span></div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-zinc-500 tabular-nums uppercase tracking-widest text-[9px]">{currentTime}</div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5"><Battery className={`w-3.5 h-3.5 ${telemetry.battery < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} /> <span className="text-white">{telemetry.battery}%</span></div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">ETA {telemetry.eta}</div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5"><Signal className="w-3.5 h-3.5 text-cyan-500" /> <span className="text-white">{telemetry.signal}</span></div>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-md border border-white/10 px-4 py-2.5 text-[11px] font-bold flex items-center gap-3 cursor-pointer">
            <span className="text-white">51°F</span>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Wind className="w-3.5 h-3.5" />
              <span>NW 10 mph</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>

        {/* Top Right: Station/User Info */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-40">
          <div className="bg-black/80 backdrop-blur-md rounded-md border border-white/10 px-3 py-2 flex items-center gap-3 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 uppercase font-black leading-none mb-0.5 tracking-widest">Base station ID</span>
              <span className="text-[10px] font-bold tracking-tight text-white/90">3457TZ0234</span>
            </div>
            <button className="bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-black px-2 py-1 rounded ml-2 uppercase leading-none shadow-[0_0_10px_rgba(0,229,255,0.3)]">Close</button>
          </div>

          <div className="bg-black/80 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 cursor-default shadow-2xl backdrop-blur-md">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 overflow-hidden">
              <Users className="w-3 h-3 text-zinc-400" />
            </div>
            <span className="text-xs font-semibold text-white/90">Aayush Aade</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>

        {/* 3. FUNCTIONAL PIP MAP (Top Right, z-40) */}
        <div className={`absolute top-20 right-6 z-40 bg-black/80 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 transition-all duration-300 group ${isMapExpanded ? 'w-[600px] h-[400px]' : 'w-80 h-64'}`}>
          <MapContainer 
            center={[18.4600, 73.8500]} 
            zoom={13} 
            zoomControl={false}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <DroneSimulationMap 
              onTelemetryUpdate={handleTelemetryUpdate} 
              isDeployed={isDeployed} 
            />

            <MiniMapControls 
              isExpanded={isMapExpanded} 
              toggleExpand={() => setIsMapExpanded(!isMapExpanded)} 
            />

            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 z-[400] tactical-grid" />
          </MapContainer>
        </div>

        {/* 4. QUICK ACTION TOOLBAR (Left, z-40) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 flex flex-col gap-4 z-40">
          <div className="flex flex-col gap-2">
            <ActionButton 
              hint="R" 
              icon={Disc} 
              color={isRecording ? "text-red-500 animate-pulse" : "text-white"} 
              onClick={toggleRecording}
            />
            <ActionButton 
              hint="P" 
              icon={Camera} 
              onClick={takeScreenshot}
            />
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div 
              onClick={() => setIsMicLive(!isMicLive)}
              className={`p-2.5 rounded-lg transition-all cursor-pointer active:scale-95 border
                ${isMicLive 
                  ? 'bg-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
                  : 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'}`}
            >
              <Mic className={`w-5 h-5 ${isMicLive ? 'text-white' : 'text-black'}`} />
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-md border border-white/10">
              <span className="text-[10px] font-bold text-white tracking-wide">
                {isMicLive ? 'MIC IS LIVE' : 'Hold "K" to talk'}
              </span>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex items-center gap-3">
            <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-inner">G</div>
            <div className="flex items-center gap-3 text-[11px] font-bold tabular-nums text-cyan-400">
              <div className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-zinc-500 rotate-90" /> -36°</div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-zinc-500" /> -24°</div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM CONTROLS (z-40) */}
        
        {/* Bottom Left: Payload Tools */}
        <div className="absolute bottom-6 left-6 flex gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md p-1 z-40 pointer-events-auto">
          {[
            { tag: 'L', title: 'Laser Target Designator' },
            { tag: 'F', title: 'Floodlight' },
            { tag: 'E', title: 'Acoustic Emitter / Siren' },
            { tag: 'N', title: 'IR Night Vision Toggle' },
            { tag: 'T', title: 'Thermal PIP' },
            { tag: 'Y', title: 'Yaw Lock' },
            { tag: 'J', title: 'Jettison Payload' }
          ].map((item) => (
            <PayloadButton 
              key={item.tag} 
              hint={item.tag} 
              title={item.title}
              active={activePayload === item.tag} 
              onClick={() => setActivePayload(item.tag)}
            />
          ))}
        </div>

        {/* Bottom Center: Autopilot */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-40">
          <button 
            onClick={() => setIsAutopilot(!isAutopilot)}
            className={`backdrop-blur-md border px-6 py-2 rounded-full flex items-center gap-3 transition-all active:scale-95 pointer-events-auto
              ${isAutopilot 
                ? 'bg-black/80 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                : 'bg-zinc-900/40 border-white/10 opacity-60'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isAutopilot ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isAutopilot ? 'text-cyan-400' : 'text-zinc-500'}`}>
              Autopilot mode is {isAutopilot ? 'on' : 'off'}
            </span>
          </button>
        </div>

        {/* Bottom Right: Camera Switcher */}
        <div className="absolute bottom-6 right-6 flex items-center gap-4 z-40 pointer-events-auto">
          <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-md overflow-hidden p-1 gap-1">
            <CameraSwitcherButton 
              label="Gimbal" 
              active={activeCamera === 'gimbal'} 
              onClick={() => {
                setActiveCamera('gimbal');
                setIsDeployed(true); // Trigger Dispatch
              }}
            />
            <CameraSwitcherButton 
              label="Forward" 
              active={activeCamera === 'forward'} 
              onClick={() => {
                setActiveCamera('forward');
                setIsDeployed(true); // Trigger Dispatch
              }}
            />
            <CameraSwitcherButton 
              label="Thermal" 
              active={activeCamera === 'thermal'} 
              onClick={() => {
                setActiveCamera('thermal');
                setIsDeployed(true); // Trigger Dispatch
              }}
            />
          </div>
          
          <button className="bg-black/60 backdrop-blur-md border border-white/10 p-2.5 rounded-md hover:bg-zinc-800 transition-colors">
            <Maximize className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// UI Components
const SidebarIconButton = ({ icon: Icon, active = false, size = 20, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${active ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-transparent text-zinc-500 hover:text-white'}`}
  >
    <Icon size={size} />
  </div>
);

const MapControlButton = ({ icon: Icon, active, onClick, tooltip }) => (
  <button 
    title={tooltip} 
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center backdrop-blur-md border rounded-lg transition-colors
      ${active ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/60 border-white/10 text-white hover:bg-zinc-800'}`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-white'}`} />
  </button>
);

const ActionButton = ({ icon: Icon, hint, color = "text-white", onClick }) => (
  <div className="flex items-center gap-3 group pointer-events-auto">
    <div 
      onClick={onClick}
      className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center hover:bg-zinc-800 cursor-pointer transition-colors relative"
    >
      <Icon className={`w-5 h-5 ${color}`} />
      {hint && <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 rounded border border-white/10 flex items-center justify-center text-[8px] font-black text-zinc-500 leading-none">{hint}</span>}
    </div>
  </div>
);

const PayloadButton = ({ hint, active, onClick, title }) => (
  <div 
    onClick={onClick}
    title={title}
    className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black transition-all cursor-pointer border ${active ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/40 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'}`}>
    {hint}
  </div>
);

const CameraSwitcherButton = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-tight ${active ? 'bg-cyan-500 text-black shadow-inner' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
    {label}
  </button>
);

export default LiveDroneHUD;
