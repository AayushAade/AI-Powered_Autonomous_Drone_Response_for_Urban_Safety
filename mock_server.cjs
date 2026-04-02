const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Frontend connected to mock socket');

  // TRIGGER: CCTV Anomaly Detection (Simulated)
  // For production, this would be an actual CV inference trigger
  const triggerAnomaly = () => {
    io.emit('cctv_anomaly', {
      id: `ANM-${Math.floor(Math.random() * 9000) + 1000}`,
      label: 'CCTV_ANOMALY (PERSON_DETECTED)',
      confidence: 0.94,
      location: [18.4550 + (Math.random() * 0.01 - 0.005), 73.8450 + (Math.random() * 0.01 - 0.005)],
      timestamp: new Date().toISOString()
    });
  };

  // Trigger an anomaly 3 seconds after connection to demo the flow
  setTimeout(triggerAnomaly, 3000);

  // Real-time Frame Uplink -> Broadcast to all Dashboard clients
  socket.on('drone_frame_uplink', (data) => {
    io.emit('vision_update', {
      image: data.image,
      timestamp: data.timestamp,
      alerts: []
    });
  });


  socket.on('disconnect', () => {
    console.log('Frontend disconnected');
  });
});

httpServer.listen(5001, () => {
  console.log('Mock Socket Server running on port 5001');
});
