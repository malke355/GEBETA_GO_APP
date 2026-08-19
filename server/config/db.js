import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

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
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
