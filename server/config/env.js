import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load server/.env even when the process is started from the repo root (common on Render).
const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: path.join(serverDir, '.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `${name} is not set. Add it in the Render Environment tab (or server/.env for local).`,
    );
  }
  return value.trim();
}

// A missing signing key must never silently fall back to a shared default,
// because that would let anyone forge tokens for any account.
const JWT_SECRET = requireEnv('JWT_SECRET');

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

// In production, never fall back to localhost Mongo — that boots, fails to connect, then exit(1).
const MONGO_URI = isProduction
  ? requireEnv('MONGO_URI')
  : process.env.MONGO_URI || 'mongodb://localhost:27017/gebetago';

if (isProduction && /localhost|127\.0\.0\.1/.test(MONGO_URI)) {
  throw new Error(
    'MONGO_URI points at localhost in production. Set it to your MongoDB Atlas connection string on Render.',
  );
}

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:8081,http://localhost:19006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const PORT = Number(process.env.PORT);
if (process.env.PORT && !Number.isFinite(PORT)) {
  throw new Error(`PORT must be a number, got: ${process.env.PORT}`);
}

export const env = {
  NODE_ENV,
  isProduction,
  PORT: Number.isFinite(PORT) && PORT > 0 ? PORT : 5000,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins,
};

export default env;
