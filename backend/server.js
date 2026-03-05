const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { donationService, impactProofService, walletService } = require('./services');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
//  Socket.IO setup
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

// Inject IO into services
donationService.setIO(io);
impactProofService.setIO(io);
walletService.setIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // Allow users to join their personal room
  socket.on('join', (data) => {
    if (data.userId) {
      socket.join(`user:${data.userId}`);
    }
    if (data.validatorId) {
      socket.join(`validator:${data.validatorId}`);
    }
    if (data.restaurantId) {
      socket.join(`restaurant:${data.restaurantId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// ─────────────────────────────────────────────
//  Security middleware
// ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// ─────────────────────────────────────────────
//  Rate limiting — per-category
// ─────────────────────────────────────────────

// Strict rate limit for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

// General API rate limit — keyed by user ID if authenticated, else IP
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Apply auth limiter to auth routes specifically
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Apply general limiter to all API routes
app.use('/api/', apiLimiter);

// ─────────────────────────────────────────────
//  Body parsing
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
//  Logging
// ─────────────────────────────────────────────
if (config.isDev()) {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────
//  API routes — versioned
// ─────────────────────────────────────────────
app.use('/api/v1', routes);

// Backward compatibility: redirect /api/ → /api/v1/
app.use('/api', routes);

// Serve frontend in production
if (config.isProd()) {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ─────────────────────────────────────────────
//  Error handling
// ─────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────
//  Global error boundaries
// ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { error: reason, promise: String(promise) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception — shutting down gracefully', { error });
  server.close(() => {
    process.exit(1);
  });
  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => process.exit(1), 10000);
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
const PORT = config.port;
server.listen(PORT, '0.0.0.0', () => {
  logger.info('IHSAN Platform API Server started', {
    environment: config.nodeEnv,
    port: PORT,
    api: `http://0.0.0.0:${PORT}/api/v1`,
    health: `http://0.0.0.0:${PORT}/api/v1/health`,
  });

  console.log(`
╔══════════════════════════════════════════╗
║       IHSAN Platform API Server          ║
║──────────────────────────────────────────║
║  Environment: ${config.nodeEnv.padEnd(26)}║
║  Port:        ${String(PORT).padEnd(26)}║
║  API (v1):    http://0.0.0.0:${PORT}/api/v1  ║
║  Health:      http://0.0.0.0:${PORT}/api/v1/health ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
