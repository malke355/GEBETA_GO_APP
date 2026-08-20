import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const jsonMessage = (message) => ({ success: false, message });
const scale = env.isProduction ? 1 : 20;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300 * scale,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many requests. Please slow down.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20 * scale,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many login attempts. Please try again later.'),
});
