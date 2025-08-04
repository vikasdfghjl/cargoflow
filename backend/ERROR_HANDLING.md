# Centralized Error Handling System

This backend implements a comprehensive centralized error handling middleware that catches all errors passed via `next(error)` from controllers and services, preventing application crashes and ensuring consistent error response format.

## Features

### 1. **Custom Error Classes**

Pre-defined error classes for common scenarios:
- `AppError` - Base application error class
- `ValidationError` - For validation errors (400)
- `AuthenticationError` - For authentication failures (401)
- `AuthorizationError` - For authorization failures (403)
- `NotFoundError` - For resource not found (404)
- `ConflictError` - For conflicts like duplicate entries (409)
- `RateLimitError` - For rate limiting (429)
- `InternalServerError` - For server errors (500)

### 2. **Async Error Handler Wrapper**

Use `asyncHandler` to automatically catch errors in async functions:

```typescript
import { asyncHandler } from '../middleware/errorHandler';

export const myController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Your async code here
  // Any thrown errors will be automatically caught and passed to error middleware
});
```

### 3. **Error Utilities**

Helper functions for creating and validating data:

```typescript
import { 
  createValidationError, 
  createAuthError, 
  validateRequired, 
  validateEmail,
  ERROR_MESSAGES 
} from '../utils/errorUtils';

// Validate required fields
validateRequired({ email, password, firstName });

// Validate email format
validateEmail(email);

// Throw predefined errors
throw createAuthError(ERROR_MESSAGES.INVALID_CREDENTIALS);
```

### 4. **Response Utilities**
Consistent response formatting:

```typescript
import { 
  sendSuccessResponse, 
  sendCreatedResponse, 
  sendPaginatedResponse,
  RESPONSE_MESSAGES 
} from '../utils/responseUtils';

// Send success response
sendSuccessResponse(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, userData);

// Send created response
sendCreatedResponse(res, RESPONSE_MESSAGES.CREATED, newResource);
```

## Usage Examples

### In Controllers

```typescript
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { validateRequired, ERROR_MESSAGES } from '../utils/errorUtils';
import { sendSuccessResponse, RESPONSE_MESSAGES } from '../utils/responseUtils';

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const updateData = req.body;

  // Validate input
  validateRequired({ userId });

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

  // Send response
  sendSuccessResponse(res, RESPONSE_MESSAGES.UPDATED, updatedUser);
});
```

### Custom Error Throwing

```typescript
// Instead of this:
if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
}

// Do this:
if (!user) {
  throw new NotFoundError('User not found');
}
```

## Error Response Format

### Development Mode
```json
{
  "success": false,
  "message": "User not found",
  "error": {
    "name": "NotFoundError",
    "statusCode": 404,
    "status": "fail",
    "stack": "Error stack trace...",
    "path": "/api/v1/users/123",
    "value": "123"
  }
}
```

### Production Mode
```json
{
  "success": false,
  "message": "User not found"
}
```

## Error Types Handled

1. **Mongoose Errors**
   - Cast errors (invalid ObjectIds)
   - Validation errors
   - Duplicate field errors

2. **JWT Errors**
   - Invalid tokens
   - Expired tokens

3. **Multer Errors**
   - File size limits
   - File type restrictions

4. **Express Validator Errors**
   - Field validation failures

5. **Custom Application Errors**
   - Business logic errors
   - Authentication/Authorization errors

## Global Error Handlers

The system also handles uncaught exceptions and unhandled promise rejections:

```typescript
// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  process.exit(1);
});
```

## Enhanced Logging

Comprehensive error logging includes:
- Timestamp
- HTTP method and URL
- Client IP address
- User agent
- Error details and stack trace
- Operational vs programming error classification

## Migration Guide

### Before (Old Way)
```typescript
export const myFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    // Your code
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### After (New Way)
```typescript
export const myFunction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Your code - errors are automatically caught
  sendSuccessResponse(res, 'Success message', result);
});
```

## Benefits

1. **Consistency** - All errors follow the same format
2. **Security** - Sensitive information hidden in production
3. **Debugging** - Comprehensive error logging
4. **Maintainability** - Centralized error handling logic
5. **Performance** - Prevents application crashes
6. **Developer Experience** - Cleaner, more readable controller code

## Best Practices

1. Always use `asyncHandler` for async route handlers
2. Use specific error classes instead of generic errors
3. Validate input data using utility functions
4. Use response utilities for consistent formatting
5. Don't expose sensitive error details in production
6. Log all errors with appropriate context
