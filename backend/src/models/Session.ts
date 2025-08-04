import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  sessionId: string;
  userId?: Types.ObjectId;
  data: Record<string, any>;
  type: 'booking_draft' | 'user_session' | 'temp_data' | 'cart' | 'preferences';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastAccessed: Date;
}

const sessionSchema = new Schema<ISession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    sparse: true // Allows null values and creates sparse index
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  type: {
    type: String,
    enum: ['booking_draft', 'user_session', 'temp_data', 'cart', 'preferences'],
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  ipAddress: {
    type: String,
    sparse: true
  },
  userAgent: {
    type: String,
    sparse: true
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Compound indexes for better query performance
sessionSchema.index({ userId: 1, type: 1 });
sessionSchema.index({ sessionId: 1, type: 1 });
sessionSchema.index({ expiresAt: 1, type: 1 });

// Update lastAccessed on every access
sessionSchema.pre('findOneAndUpdate', function() {
  this.set({ lastAccessed: new Date() });
});

// Static method to create session with default expiry
sessionSchema.statics.createSession = function(sessionData: {
  sessionId: string;
  userId?: string;
  data: Record<string, any>;
  type: ISession['type'];
  expiryMinutes?: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const expiryMinutes = sessionData.expiryMinutes || 60; // Default 1 hour
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return this.create({
    sessionId: sessionData.sessionId,
    userId: sessionData.userId ? new Types.ObjectId(sessionData.userId) : undefined,
    data: sessionData.data,
    type: sessionData.type,
    expiresAt,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent
  });
};

// Static method to get and update session
sessionSchema.statics.getAndRefreshSession = async function(sessionId: string, extendMinutes = 60) {
  const session = await this.findOneAndUpdate(
    { 
      sessionId, 
      expiresAt: { $gt: new Date() } // Only non-expired sessions
    },
    { 
      $set: { 
        lastAccessed: new Date(),
        expiresAt: new Date(Date.now() + extendMinutes * 60 * 1000)
      }
    },
    { new: true }
  );
  
  return session;
};

export default model<ISession>('Session', sessionSchema);
