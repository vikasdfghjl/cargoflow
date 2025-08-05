import mongoose from 'mongoose';

class PersistentTestDatabase {
  private static instance: PersistentTestDatabase;
  private isConnected = false;

  private constructor() {}

  static getInstance(): PersistentTestDatabase {
    if (!PersistentTestDatabase.instance) {
      PersistentTestDatabase.instance = new PersistentTestDatabase();
    }
    return PersistentTestDatabase.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return; // Already connected
    }

    try {
      // Use a dedicated test database (not in-memory)
      const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cargoflow-test-persistent';
      
      await mongoose.connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      });

      this.isConnected = true;
      console.log('Connected to persistent test database:', mongoUri);
      
    } catch (error) {
      console.error('Failed to connect to persistent test database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // Just disconnect, don't drop the database
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from persistent test database');
    } catch (error) {
      console.error('Error disconnecting from persistent test database:', error);
      this.isConnected = false;
    }
  }

  // Optional method to clear specific collections
  async clearCollection(collectionName: string): Promise<void> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      const collection = mongoose.connection.collections[collectionName];
      if (collection) {
        await collection.deleteMany({});
        console.log(`Cleared collection: ${collectionName}`);
      }
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
    }
  }

  isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default PersistentTestDatabase;
