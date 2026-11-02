import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocketIO } from './services/socketService.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});
app.use(cors({
  origin: '*', // Allows local testing and OBS browser sources
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocketIO(io);

// Database Connection
connectDB();

// API Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    app: 'StreamPulse AI API',
    status: 'online',
    version: '1.0.0'
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 StreamPulse Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for dashboard & OBS overlay.`);
});
