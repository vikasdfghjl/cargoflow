import mongoose from 'mongoose';
import { log } from '../lib/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cargoflow';
    
    const options = {
      // Remove deprecated options
      // useNewUrlParser and useUnifiedTopology are now defaults
    };

    const conn = await mongoose.connect(mongoURI, options);

  log.info('MongoDB connected', { host: conn.connection.host, db: conn.connection.name });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      log.error('MongoDB connection error', { error: (err as Error).message });
    });

    mongoose.connection.on('disconnected', () => {
      log.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      log.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    log.error('MongoDB connection failed', { error: (error as Error).message });
    process.exit(1);
  }
};

export default connectDB;
