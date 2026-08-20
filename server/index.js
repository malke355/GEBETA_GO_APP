import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';

import env from './config/env.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import createSocketServer from './config/socket.js';
import { attachIo } from './utils/realtime.js';

await connectDB();

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
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

const io = createSocketServer(server);
attachIo(app, io);

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

export { app, server, io };
