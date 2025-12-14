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

// Trust proxy (required for Render/Heroku/Railway)
app.set('trust proxy', 1);

// DEBUG LOGGING
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
  next();
});

// CORS Configuration (Moved to top)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];

    // Log the check
    logger.info(`Checking CORS for origin: ${origin}`);

    // Allow all Vercel and Netlify URLs (production and preview)
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app') || origin.includes('.netlify.app')) {
      callback(null, true);
    } else {
      logger.error(`BLOCKED CORS for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(helmet());
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
      ];

      // Allow all Vercel and Netlify URLs
      if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app') || origin.includes('.netlify.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rate limiting (moved up)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  validate: { xForwardedForHeader: false } // Disable validation to fix Render deployment
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
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongoStatus: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    mongoHost: mongoose.connection.host
  });
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


// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  // Print registered routes
  logger.info('Registered Routes:');
  app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
      logger.info(r.route.path)
    } else if (r.name === 'router') {
      // This is a mounted router
      const regex = r.regexp.toString();
      logger.info(`Router mounted: ${regex}`);
    }
  });
});