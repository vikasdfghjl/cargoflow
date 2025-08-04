import { Schema, model, Document, Types } from 'mongoose';

export interface IRateLimit extends Document {
  _id: Types.ObjectId;
  identifier: string; // IP address, user ID, or API key
  endpoint: string;
  requests: number;
  windowStart: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  requests: {
    type: Number,
    default: 1,
    min: 0
  },
  windowStart: {
    type: Date,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true,
  collection: 'ratelimits'
});

// Compound indexes for efficient queries
rateLimitSchema.index({ identifier: 1, endpoint: 1 }, { unique: true });
rateLimitSchema.index({ identifier: 1, windowStart: 1 });

// Static method to check and update rate limit
rateLimitSchema.statics.checkRateLimit = async function(
  identifier: string, 
  endpoint: string, 
  maxRequests: number, 
  windowMs: number
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    // Try to find existing rate limit record
    const existingLimit = await this.findOne({
      identifier,
      endpoint,
      windowStart: { $gte: windowStart }
    });

    if (existingLimit) {
      if (existingLimit.requests >= maxRequests) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: existingLimit.expiresAt,
          totalRequests: existingLimit.requests
        };
      }

      // Increment request count
      existingLimit.requests += 1;
      existingLimit.expiresAt = expiresAt;
      await existingLimit.save();

      return {
        allowed: true,
        remainingRequests: maxRequests - existingLimit.requests,
        resetTime: existingLimit.expiresAt,
        totalRequests: existingLimit.requests
      };
    } else {
      // Create new rate limit record
      await this.create({
        identifier,
        endpoint,
        requests: 1,
        windowStart: now,
        expiresAt
      });

      return {
        allowed: true,
        remainingRequests: maxRequests - 1,
        resetTime: expiresAt,
        totalRequests: 1
      };
    }
  } catch (error: any) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      // Retry the check by calling the static method on the model
      const Model = this as any;
      return Model.checkRateLimit(identifier, endpoint, maxRequests, windowMs);
    }
    throw error;
  }
};

// Clean up expired records (optional, TTL index handles this automatically)
rateLimitSchema.statics.cleanup = async function() {
  const now = new Date();
  await this.deleteMany({ expiresAt: { $lt: now } });
};

export default model<IRateLimit>('RateLimit', rateLimitSchema);
