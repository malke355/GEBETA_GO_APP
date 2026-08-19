import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:8081,http://localhost:19006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV,
  isProduction,
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/gebetago',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins,
};

export default env;
