import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [currentActiveDroneSource, setCurrentActiveDroneSource] = useState(localStorage.getItem('currentActiveDroneSource') || null);

  useEffect(() => {
    if (currentActiveDroneSource) {
      localStorage.setItem('currentActiveDroneSource', currentActiveDroneSource);
    }
  }, [currentActiveDroneSource]);

  const [radarNodes, setRadarNodes] = useState([]);
  const [mapState, setMapState] = useState({
    center: [18.4600, 73.8500],
    zoom: 15,
    markers: [
      { id: 'HUB_01', pos: [18.4600, 73.8500], type: 'HUB', label: '[COMMAND_HUB]' },
      { id: 'AERO_01', pos: [18.4650, 73.8550], type: 'UNIT', label: '[UNIT_01]' },
      { id: 'TARGET_01', pos: [18.4550, 73.8450], type: 'TARGET', label: '[ANOMALY_DETECTED]' }
    ],
    paths: [
      [[18.4650, 73.8550], [18.4600, 73.8500]],
      [[18.4600, 73.8500], [18.4550, 73.8450]]
    ]
  });
  const [alertLog, setAlertLog] = useState([]);
  const [fleetStatus, setFleetStatus] = useState([
    { id: 'ACTIVE', status: 'Active', count: 5, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'CHARGING', status: 'Charging', count: 4, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { id: 'STANDBY', status: 'Ready', count: 3, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
  ]);
  const [telemetry, setTelemetry] = useState({
    cpuLoad: 0,
    networkBandwidth: '0.00 Mbps',
    storageIOPS: '0.0 %',
    thermalState: 'AWAITING_LINK',
    encryption: 'LINKING...'
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setIsConnected(true);
        setTelemetry(prev => ({ ...prev, thermalState: 'STABLE', encryption: 'AES-256 ACTIVE' }));
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setVideoStream(null);
        setTelemetry(prev => ({ ...prev, thermalState: 'AWAITING_LINK', encryption: 'LINKING...' }));
      });

      socket.on('cctv_anomaly', (data) => {
        // High-Priority Alert Trigger from CCTV
        setAlertLog(prev => [{
          id: `ALERT-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          object: data.label || 'CCTV_ANOMALY',
          confidence: data.confidence || 0.92,
          type: 'CRITICAL',
          location: data.location || [18.4550, 73.8450],
          requiresDeployment: true,
          status: 'PENDING_AUTHORITY'
        }, ...prev].slice(0, 10));
      });

      socket.on('vision_update', (data) => {
        if (data.image) {
          const formatted = data.image.startsWith('data:image') 
            ? data.image 
            : `data:image/jpeg;base64,${data.image}`;
          setVideoStream(formatted);
        }
        
        setTelemetry(prev => ({
          ...prev,
          cpuLoad: Math.floor(Math.random() * 5 + 82),
          networkBandwidth: `${(Math.random() * 2 + 12).toFixed(1)} Mbps`,
          storageIOPS: `${(Math.random() * 3 + 45).toFixed(1)} %`
        }));
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('cctv_anomaly');
        socket.off('vision_update');
      };
    }
  }, [socket]);

  const deployDrone = (alertId) => {
    const targetAlert = alertLog.find(a => a.id === alertId);
    if (!targetAlert) return;

    // Transition Logic: No automatic move, only on manual authority
    setFleetStatus(prev => prev.map(d => 
      d.id === 'SN_DRONE01' ? { ...d, status: 'DEPLOYED' } : d
    ));

    setAlertLog(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: 'EN_ROUTE' } : a
    ));

    // Simple pathing: Start at HUB [18.4600, 73.8500], end at Alert location
    // In a real A* implementation, we'd calculate via waypoints to avoid NFZs
    setMapState(prev => ({
      ...prev,
      markers: prev.markers.map(m => 
        m.id === 'AERO_01' ? { ...m, pos: targetAlert.location, label: '[UNIT_01: EN_ROUTE]' } : m
      ),
      paths: [[[18.4600, 73.8500], targetAlert.location]]
    }));
  };

  const connectSystem = () => {
    if (!socket) {
      const serverUrl = `http://${window.location.hostname}:5001`;
      setSocket(io(serverUrl));
    }
  };

  const disconnectSystem = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setVideoStream(null);
    setAlertLog([]);
    setRadarNodes([]);
    setTelemetry({
      cpuLoad: 0,
      networkBandwidth: '0.00 Mbps',
      storageIOPS: '0.0 %',
      thermalState: 'AWAITING_LINK',
      encryption: 'LINKING...'
    });
  };

  return (
    <SystemContext.Provider value={{
      isConnected,
      videoStream,
      setVideoStream,
      currentActiveDroneSource,
      setCurrentActiveDroneSource,
      radarNodes,
      mapState,
      setMapState,
      alertLog,
      fleetStatus,
      telemetry,
      connectSystem,
      disconnectSystem,
      deployDrone
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystemState = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystemState must be used within a SystemProvider');
  return context;
};
