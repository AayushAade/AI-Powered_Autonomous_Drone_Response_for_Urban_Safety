import React, { useState, useEffect, useMemo } from 'react';
import { Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// Utility for Quadratic Bezier Curve Generation
const generateCurvePoints = (start, end, control, steps = 100) => {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const lat = Math.pow(1 - t, 2) * start[0] + 2 * (1 - t) * t * control[0] + Math.pow(t, 2) * end[0];
    const lng = Math.pow(1 - t, 2) * start[1] + 2 * (1 - t) * t * control[1] + Math.pow(t, 2) * end[1];
    points.push([lat, lng]);
  }
  return points;
};

// Utility to calculate heading between two points
const calculateHeading = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const dy = p2[0] - p1[0];
  const dx = p2[1] - p1[1];
  const theta = Math.atan2(dy, dx); // range (-PI, PI]
  // Add 90 degree offset so the SVG arrow aligns with the flight path
  return ((theta * 180) / Math.PI) + 90; // rad to deg + offset
};

const DroneSimulationMap = ({ onTelemetryUpdate, isDeployed = false }) => {
  const map = useMap();
  
  // 1. COORDINATES & ROUTE SETUP
  const startPos = [18.4600, 73.8500]; // Base Station
  const endPos = [18.5204, 73.8567];   // Incident Location (Pune)
  const controlPoint = [18.4800, 73.8800]; // Offset for curve
  
  const route = useMemo(() => generateCurvePoints(startPos, endPos, controlPoint, 200), []);
  
  // 2. ANIMATION STATE
  const [index, setIndex] = useState(0);
  const currentPos = route[index];
  const nextPos = route[index + 1] || currentPos;
  const heading = calculateHeading(currentPos, nextPos);

  // 3. ANIMATION LOOP
  useEffect(() => {
    // GATE: Only run the animation loop if the drone is deployed
    if (!isDeployed || index >= route.length - 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => {
        const nextIdx = prev + 1;
        
        // FIX: Telemetry Logic now resides safely inside the interval tick
        if (onTelemetryUpdate) {
          const isNearEnd = nextIdx > route.length * 0.8;
          const baseSpeed = isNearEnd ? 12 : 35;
          const jitter = (Math.random() - 0.5) * 2;
          const altJitter = (Math.random() - 0.5) * 10;
          
          // Calculate Dynamic ETA
          const remainingSteps = route.length - nextIdx;
          const intervalMs = 100; // Match the setInterval delay
          const remainingSeconds = Math.max(0, Math.floor((remainingSteps * intervalMs) / 1000));
          
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          const formattedETA = `${mins}m ${secs.toString().padStart(2, '0')}s`;
          
          onTelemetryUpdate({
            speed: Math.max(5, Math.floor(baseSpeed + jitter)),
            alt: Math.floor(200 + altJitter),
            progress: Math.floor((nextIdx / route.length) * 100),
            eta: formattedETA
          });
        }
        
        return nextIdx;
      });
    }, 100); // 10fps for smooth motion

    return () => clearInterval(timer);
  }, [index, route, onTelemetryUpdate]);

  // Center map on drone periodically
  useEffect(() => {
    if (index % 10 === 0) {
      map.panTo(currentPos, { animate: true, duration: 0.5 });
    }
  }, [currentPos, index, map]);

  // 4. CUSTOM DRONE ICON (Arrow)
  const droneIcon = L.divIcon({
    className: 'drone-marker-container',
    html: `
      <div style="transform: rotate(${heading + 90}deg); transition: transform 0.1s linear;" class="flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#00e5ff" stroke="#00e5ff" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <div class="absolute w-8 h-8 rounded-full border border-cyan-500/30 animate-ping opacity-20"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // 5. INCIDENT ICON
  const incidentIcon = L.divIcon({
    className: 'incident-marker-container',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 bg-red-500/20 rounded-full animate-pulse border border-red-500/40"></div>
        <div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <>
      {/* Traveled Path (Solid Cyan) */}
      <Polyline 
        positions={route.slice(0, index + 1)} 
        pathOptions={{ color: '#00e5ff', weight: 4, lineCap: 'round', opacity: 1 }} 
      />
      
      {/* Remaining Path (Dashed Cyan) */}
      <Polyline 
        positions={route.slice(index)} 
        pathOptions={{ color: '#00e5ff', weight: 3, dashArray: '8, 12', opacity: 0.4 }} 
      />

      {/* Drone Marker */}
      <Marker position={currentPos} icon={droneIcon} />

      {/* Incident Marker */}
      <Marker position={endPos} icon={incidentIcon}>
        <Tooltip permanent direction="top" offset={[0, -10]} opacity={1}>
          <div className="bg-[#18181b] border border-[#27272a] text-white px-3 py-1.5 rounded-md shadow-2xl flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">Target Incident</span>
            <span className="text-[11px] font-bold text-white/90">Sector 7 Command, Pune</span>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

export default DroneSimulationMap;