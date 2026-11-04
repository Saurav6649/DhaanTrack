import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (uri = ENV.MONGODB_URI) => {
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error) {
    console.error('[Database] Disconnection error:', error.message);
  }
};
