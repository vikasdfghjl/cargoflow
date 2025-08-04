import { Request, Response, NextFunction } from 'express';
import RateLimit from '../models/RateLimit';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  onLimitReached?: (req: Request, res: Response) => void; // Callback when limit is reached
}

// Default key generator using IP address
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// Create stateless rate limiter middleware
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    onLimitReached
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = keyGenerator(req);
      const endpoint = `${req.method}:${req.route?.path || req.path}`;

      // Check rate limit using database
      const rateLimitResult = await (RateLimit as any).checkRateLimit(
        identifier,
        endpoint,
        maxRequests,
        windowMs
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString(),
        'X-RateLimit-Used': rateLimitResult.totalRequests.toString()
      });

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
        });
        return;
      }

      // Store original res.json to intercept response
      const originalJson = res.json;
      res.json = function(this: Response, body: any) {
        const statusCode = this.statusCode;
        
        // Skip counting based on configuration
        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          // Note: In a stateless system, we can't easily "undo" the count
          // This is a limitation of database-based rate limiting
          // Consider implementing this at the application layer if needed
        }

        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      // Log error but don't block the request
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiter
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.'
  }),

  // Strict rate limiter for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
    keyGenerator: (req) => {
      // Use email if available, fallback to IP
      const email = req.body?.email;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return email ? `email:${email}` : `ip:${ip}`;
    }
  }),

  // Rate limiter for booking creation
  booking: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many booking requests, please try again later.',
    keyGenerator: (req) => {
      // Use user ID if authenticated, fallback to IP
      const userId = (req as any).user?.userId;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return userId ? `user:${userId}` : `ip:${ip}`;
    }
  }),

  // Rate limiter for address management
  address: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many address operations, please try again later.',
    keyGenerator: (req) => {
      const userId = (req as any).user?.userId;
      return userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
    }
  })
};

export default createRateLimiter;
