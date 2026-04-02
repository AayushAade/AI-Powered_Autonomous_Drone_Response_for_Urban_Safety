import React, { useState, useRef, useEffect } from 'react';
import { Power, Camera, RefreshCw, Activity, Shield, Clock, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import { Peer } from 'peerjs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

const MobileDroneNode = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [mediaStream, setMediaStream] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const broadcastIntervalRef = useRef(null);
  const modelRef = useRef(null);
  const [modelLoading, setModelLoading] = useState(true);

  // Initialize Socket & Peer Connection
  useEffect(() => {
    const serverUrl = `http://${window.location.hostname}:5001`;
    socketRef.current = io(serverUrl);
    socketRef.current.on('connect', () => console.log('Socket Connected'));

    // Initialize WebRTC Peer
    const peer = new Peer();
    peer.on('open', (id) => {
      console.log('Drone Peer registered with ID:', id);
    });
    
    peer.on('disconnected', () => {
      console.warn('Drone peer disconnected. Reconnecting...');
      peer.reconnect();
    });

    peer.on('error', (err) => {
      console.error('Drone Peer Error:', err.type, err);
    });

    socketRef.current.peer = peer;

    // Load YOLOv8 Model
    const loadModel = async () => {
      try {
        console.log("Loading YOLOv8 Model...");
        await tf.ready();
        const modelUrl = 'https://quic-solutions.github.io/yolov8-tfjs/yolov8n_web_model/model.json';
        const model = await tf.loadGraphModel(modelUrl);
        modelRef.current = model;
        setModelLoading(false);
        console.log("YOLOv8 Model Loaded.");
      } catch (err) {
        console.error("Model load failed:", err);
        setModelLoading(false);
      }
    };
    loadModel();
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peer) peer.destroy();
      stopBroadcast();
      stopCamera();
    };
  }, []);

  // Live Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect-Driven Stream Attachment (NUCLEAR FIX #2: Vanilla JS Fallback)
  useEffect(() => {
    if (mediaStream) {
      // 1. React Ref Attachment
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => console.error("React play failed:", err));
      }
      
      // 2. Vanilla JS Bypass Fallback
      const vidEl = document.getElementById('tactical-camera-feed');
      if (vidEl) {
        vidEl.srcObject = mediaStream;
        vidEl.play().catch(e => console.error("Vanilla play failed:", e));
      }
    }
  }, [mediaStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode }, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      
      // Early Vanilla JS Bypass
      const vidEl = document.getElementById('tactical-camera-feed');
      if (vidEl) vidEl.srcObject = stream;

      setMediaStream(stream);
      setIsPlaying(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("CAMERA ACCESS DENIED. CHECK PERMISSIONS.");
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsPlaying(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Re-start camera when facingMode changes
  useEffect(() => {
    if (isPlaying) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  // YOLOv8 Detection Loop
  useEffect(() => {
    let animationFrameId;

    const detectFrame = async () => {
      if (!modelRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      tf.engine().startScope();

      // 1. Preprocess: Resize to 640x640 and normalize
      const input = tf.tidy(() => {
        const img = tf.browser.fromPixels(video);
        return img.resizeBilinear([640, 640])
                  .div(255.0)
                  .expandDims(0);
      });

      // 2. Inference
      const res = modelRef.current.execute(input);
      
      // 3. Post-process (Shape: could be [1, 84, 8400] or [1, 8400, 84])
      const output = res.dataSync();
      const shape = res.shape; // e.g., [1, 84, 8400] or [1, 8400, 84]
      
      let transRes;
      if (shape[1] === 84) {
        transRes = res.transpose([0, 2, 1]); // -> [1, 8400, 84]
      } else {
        transRes = res; // Already [1, 8400, 84]
      }

      const boxes = tf.tidy(() => {
        const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
        const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
        const x1 = transRes.slice([0, 0, 0], [-1, -1, 1]).sub(w.div(2));
        const y1 = transRes.slice([0, 0, 1], [-1, -1, 1]).sub(h.div(2));
        return tf.concat([y1, x1, y1.add(h), x1.add(w)], 2).squeeze();
      });

      const scores = tf.tidy(() => {
        const rawScores = transRes.slice([0, 0, 4], [-1, -1, 80]); // 80 classes
        return rawScores.max(2).squeeze();
      });

      const classes = tf.tidy(() => {
        const rawScores = transRes.slice([0, 0, 4], [-1, -1, 80]);
        return rawScores.argMax(2).squeeze();
      });

      // 4. NMS
      const nmsIndices = await tf.image.nonMaxSuppressionAsync(boxes, scores, 50, 0.45, 0.5);
      const detectionIndices = nmsIndices.arraySync();

      // 5. Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      detectionIndices.forEach(idx => {
        const classId = classes.slice([idx], [1]).dataSync()[0];
        const score = scores.slice([idx], [1]).dataSync()[0];

        // Filter for 'person' (Class ID 0)
        if (classId === 0 && score > 0.4) {
          const box = boxes.slice([idx, 0], [1, 4]).dataSync();
          
          // Map back to canvas size
          const minY = box[0] * canvas.height / 640;
          const minX = box[1] * canvas.width / 640;
          const maxY = box[2] * canvas.height / 640;
          const maxX = box[3] * canvas.width / 640;
          const width = maxX - minX;
          const height = maxY - minY;

          // Draw Tactical Box
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.strokeRect(minX, minY, width, height);

          // Draw Label
          ctx.fillStyle = '#22d3ee';
          ctx.font = '10px JetBrains Mono, monospace';
          const label = `PERSON - ${Math.round(score * 100)}%`;
          const textWidth = ctx.measureText(label).width;
          ctx.fillRect(minX, minY - 15, textWidth + 10, 15);
          ctx.fillStyle = 'black';
          ctx.fillText(label, minX + 5, minY - 4);
        }
      });

      tf.engine().endScope();
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    if (isPlaying) {
      detectFrame();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);


  const startBroadcast = () => {
    if (!isPlaying || !mediaStream) {
      alert("ACTIVATE CAMERA FIRST.");
      return;
    }
    
    setIsBroadcasting(true);
    
    // WebRTC Peer Call - Establish Direct P2P Video Link
    const peer = socketRef.current.peer;
    if (peer) {
      console.log('Initiating WebRTC Uplink to skynetra-hub-01...');
      const call = peer.call('skynetra-hub-01', mediaStream);
      
      call.on('stream', () => {
        console.log('Uplink confirmed by Hub. Streaming data...');
        setIsBroadcasting(true);
      });

      call.on('error', (err) => {
        console.error('Tactical Link Error:', err);
        setIsBroadcasting(false);
        alert(`Link Error: ${err.message}`);
      });

      call.on('close', () => {
        console.warn('WebRTC Link closed by remote.');
        setIsBroadcasting(false);
      });

      broadcastIntervalRef.current = call;
    }
  };

  const stopBroadcast = () => {
    setIsBroadcasting(false);
    if (broadcastIntervalRef.current && typeof broadcastIntervalRef.current.close === 'function') {
      broadcastIntervalRef.current.close();
      broadcastIntervalRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent text-white overflow-hidden font-mono select-none flex flex-col">
      {/* Edge Detection Overlay Canvas */}
      <canvas 
        ref={canvasRef} 
        width={640}
        height={640}
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Main Video Viewport - NUCLEAR FIX #1: Fixed Position & Z-Index */}
      <div className="flex-grow relative bg-transparent overflow-hidden">
        {isPlaying && (
          <video 
            id="tactical-camera-feed"
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            onLoadedMetadata={() => {
              const el = document.getElementById('tactical-camera-feed');
              el?.play().catch(console.error);
            }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              objectFit: 'cover', 
              zIndex: 0, 
              backgroundColor: 'red' // indicator to see if element exists
            }}
            className="grayscale-[0.2] brightness-110"
          />
        )}
        
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-20">
            {modelLoading ? (
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.5em] text-cyan-400">Loading Neural Core...</p>
              </div>
            ) : (
              <>
                <Camera className="w-16 h-16 text-cyan-500 animate-pulse" />
                <p className="text-[12px] uppercase tracking-[0.5em] text-cyan-400">Optical Sensor Offline</p>
              </>
            )}
          </div>
        )}

        {/* Tactical Overlay: Top Bar - Ensure z-index 10+ */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/90 to-transparent p-6 flex items-start justify-between z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 italic">SkyNetra Node_A1</span>
            </div>
            
            <div className="flex flex-col gap-1.5 bg-black/40 border-l border-white/10 p-2 rounded-r-md">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${modelLoading ? 'bg-slate-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/60">
                  Neural Core: {modelLoading ? 'Initializing...' : 'Online'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isBroadcasting ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]' : 'bg-slate-500'}`} />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/60">
                  Uplink: {isBroadcasting ? 'Broadcasting' : 'Standby'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tabular-nums italic">
                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-[7px] font-bold text-slate-500 tracking-[0.2em] uppercase">Auth: Level IV</span>
          </div>
        </div>

        {/* Center Crosshair / Reticle - Ensure z-index 10+ */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative w-64 h-64 border border-cyan-500/20 rounded-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-[1px] bg-cyan-500/80" />
              <div className="h-8 w-[1px] bg-cyan-500/80" />
            </div>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-lg" />
            {isBroadcasting && <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full animate-ping" />}
          </div>
        </div>

        {/* Corner Telemetry Readouts - Ensure z-index 10+ */}
        <div className="absolute bottom-24 left-6 flex flex-col gap-3 pointer-events-none z-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Signal_Str</span>
            <div className="flex gap-0.5 h-2 items-end">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 rounded-t-[1px] ${i <= 5 ? 'bg-cyan-500' : 'bg-slate-800'}`} style={{ height: `${i * 20}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-cyan-500/5 border-l-2 border-cyan-500 px-2 py-1">
             <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-2.5 h-2.5" /> Bitrate: 4.2 MB/S
             </span>
          </div>
        </div>

        {/* NUCLEAR FIX #3: Manual Force Play Kickstart Button */}
        {isPlaying && (
          <button 
            onClick={() => {
              const vid = document.getElementById('tactical-camera-feed');
              vid?.play().catch(alert);
            }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-rose-600 text-[10px] font-black rounded-lg border-2 border-white animate-bounce shadow-[0_0_20px_rgba(255,0,0,0.5)]"
          >
            FORCE PLAY VIDEO
          </button>
        )}
      </div>

      {/* Control Bar: Bottom Section - Ensure z-index 20 */}
      <div className="h-32 shrink-0 bg-slate-950 border-t border-white/5 px-8 flex items-center justify-between pb-4 z-20">
        <button 
          onClick={toggleCamera}
          className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group active:scale-95 transition-all"
        >
          <RefreshCw className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
        </button>

        {!isPlaying ? (
          <button 
            onClick={startCamera}
            className="px-10 py-5 bg-cyan-500 rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 shadow-[0_0_20px_#22d3ee20] active:scale-95 transition-all"
          >
            <Camera className="w-5 h-5" />
            Init Sensors
          </button>
        ) : (
          <button 
            onClick={isBroadcasting ? stopBroadcast : startBroadcast}
            className={`px-10 py-5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 transition-all active:scale-95 ${
              isBroadcasting 
                ? 'bg-rose-500 shadow-[0_0_30px_#f43f5e] animate-pulse' 
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
          >
            <Power className="w-5 h-5" />
            {isBroadcasting ? 'Terminate Link' : 'Establish Link'}
          </button>
        )}

        <button 
          onClick={() => isPlaying ? stopCamera() : startCamera()}
          className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group active:scale-95 transition-all"
        >
          <Camera className={`w-6 h-6 transition-colors ${isPlaying ? 'text-cyan-400' : 'text-slate-500'}`} />
        </button>
      </div>
    </div>
  );
};

export default MobileDroneNode;
