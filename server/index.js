import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import env from './config/env.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { uploadDir } from './middleware/upload.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import createSocketServer from './config/socket.js';
import { attachIo } from './utils/realtime.js';

const DB_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

try {
  await connectDB();
} catch (error) {
  console.error('Fatal boot error while connecting to the database:', error);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Reject without throwing — a thrown Error here becomes an unhandled 500 for browsers.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    mongo: DB_STATE_LABELS[dbState] ?? 'unknown',
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const io = createSocketServer(server);
attachIo(app, io);

server.on('error', (error) => {
  console.error('HTTP server failed to start:', error);
  process.exit(1);
});

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`GebetaGo API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully.`);
  io.close();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

export { app, server, io };
