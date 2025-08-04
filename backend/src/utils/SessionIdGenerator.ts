import crypto from 'crypto';

// Alternative ID generator utility
export class SessionIdGenerator {
  // Generate a cryptographically secure 16-character session ID
  static generateShortId(): string {
    return crypto.randomBytes(12).toString('base64url'); // 16 characters, URL-safe
  }

  // Generate a longer secure ID (24 characters)
  static generateLongId(): string {
    return crypto.randomBytes(18).toString('base64url'); // 24 characters, URL-safe
  }

  // Generate timestamp-based ID with randomness (sortable + unique)
  static generateTimestampId(): string {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const random = crypto.randomBytes(6).toString('base64url'); // 8 chars random
    return `${timestamp}-${random}`; // ~20 characters total, sortable by time
  }

  // MongoDB ObjectId (recommended for MongoDB)
  static generateObjectId(): string {
    // This would use: new Types.ObjectId().toString()
    // 24 hex characters, optimized for MongoDB
    return crypto.randomBytes(12).toString('hex');
  }
}

export default SessionIdGenerator;
