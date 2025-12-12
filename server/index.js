import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import usageRoutes from './routes/usage.js';
import alertRoutes from './routes/alerts.js';
import goalRoutes from './routes/goals.js';
import reportRoutes from './routes/reports.js';
import activityRoutes from './routes/activity.js';
import adminRoutes from './routes/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { initializeSimulation } from './services/simulation.js';
import insightsRoutes from './routes/insights.js';
import automationRoutes from './routes/automation.js';
import settingsRoutes from './routes/settings.js';
import exportRoutes from './routes/export.js';
import comparisonRoutes from './routes/comparison.js';
import logger from './utils/logger.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
      ];

      // Allow all Vercel URLs
      if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];

    // Allow all Vercel URLs (production and preview)
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/energysaver')
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/usage', authMiddleware, usageRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/insights', authMiddleware, insightsRoutes);
app.use('/api/automation', authMiddleware, automationRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/comparison', authMiddleware, comparisonRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('User connected:', socket.id);

  socket.on('join-home', (homeId) => {
    socket.join(homeId);
    logger.info(`User ${socket.id} joined home ${homeId}`);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected:', socket.id);
  });
});

// Make io available globally for real-time updates
global.io = io;

// Initialize simulation
initializeSimulation(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});