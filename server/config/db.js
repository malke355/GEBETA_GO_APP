import mongoose from 'mongoose';
import env from './env.js';

const MAX_ATTEMPTS = env.isProduction ? 5 : 1;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const conn = await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      });

      console.log(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error.message);
      });

      return conn;
    } catch (error) {
      lastError = error;
      console.error(
        `Database connection error (attempt ${attempt}/${MAX_ATTEMPTS}): ${error.message}`,
      );

      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  console.error(
    'MongoDB is unreachable. On Render, confirm MONGO_URI is a reachable Atlas URI ' +
      '(Network Access allows 0.0.0.0/0 or Render egress) and that the cluster is not paused.',
  );
  console.error(lastError?.stack || lastError?.message || 'Unknown database error');
  process.exit(1);
};

export default connectDB;
