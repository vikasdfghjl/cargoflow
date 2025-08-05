import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

class TestDatabase {
  private static instance: TestDatabase;
  private mongoServer: MongoMemoryServer | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return; // Already connected
    }

    try {
      // Close any existing connections
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Start in-memory MongoDB instance - THIS IS NOT YOUR REAL DATABASE!
      // MongoMemoryServer creates a completely separate, temporary database in memory
      this.mongoServer = await MongoMemoryServer.create();

      const mongoUri = this.mongoServer.getUri();
      console.log('🧪 Test DB URI:', mongoUri); // This will show it's NOT your real database
      
      // Connect with test-specific options
      await mongoose.connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      });

      this.isConnected = true;
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('Test DB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to test database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // Drop database if connected
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
      }
      
      // Close mongoose connection
      await mongoose.disconnect();
      
      // Stop MongoDB memory server
      if (this.mongoServer) {
        await this.mongoServer.stop();
        this.mongoServer = null;
      }
      
      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from test database:', error);
      // Force cleanup even if there are errors
      this.isConnected = false;
      this.mongoServer = null;
    }
  }

  async clearDatabase(): Promise<void> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      const collections = mongoose.connection.collections;
      const clearPromises = Object.values(collections).map(async (collection) => {
        if (collection) {
          await collection.deleteMany({});
        }
      });
      
      await Promise.all(clearPromises);
    } catch (error) {
      console.error('Error clearing test database:', error);
    }
  }

  getConnectionState(): number {
    return mongoose.connection.readyState;
  }

  isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default TestDatabase;
