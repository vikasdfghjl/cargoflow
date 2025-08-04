

# 🚀 AI Coding Agent Instructions for Cargo Pathway Pro

This document provides comprehensive guidelines for AI coding agents working on the Cargo Pathway Pro B2B logistics platform. Following these instructions ensures consistency, maintainability, and high-quality code across the full-stack TypeScript application.

## 📜 Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [General Principles](#general-principles)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [Authentication & Security](#authentication--security)
- [Code Patterns & Standards](#code-patterns--standards)
- [File Structure & Naming](#file-structure--naming)

---

## �️ Project Overview

**Cargo Pathway Pro** is a B2B logistics and transport management platform featuring:
- Customer booking and tracking system
- Admin dashboard for operations management
- Driver management and assignment
- Real-time shipment tracking
- Invoice and billing management
- Role-based access control (Customer/Admin)

## 🛠️ Architecture & Tech Stack

### Frontend (Port 3000)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v6
- **State Management**: React Context + TanStack Query
- **UI Components**: shadcn/ui component library
- **Forms**: React Hook Form (when implemented)

### Backend (Port 5000)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens + bcryptjs
- **Validation**: express-validator
- **Error Handling**: Centralized error middleware

## 🎯 General Principles

### 1. Type Safety First
Every piece of code must be strictly typed. Use the comprehensive type definitions in `/backend/src/types/index.ts` and avoid `any` types.

**Example from the project:**
```typescript
// Always use defined interfaces
import { IUser, IBooking, ApiResponse } from '../types';

// Controller responses must follow ApiResponse pattern
const response: ApiResponse<IUser> = {
  success: true,
  message: 'User retrieved successfully',
  data: user
};
```

### 2. Consistent Error Handling
Use the established error handling patterns with proper HTTP status codes and structured responses.

### 3. Follow Established Patterns
Reference existing components and controllers for consistent patterns. The codebase has well-established conventions that should be maintained.

---

## 💻 Frontend Development

### Core Architecture Patterns

#### Component Structure
Follow the established pattern seen in existing components:

```tsx
// Standard component structure (from existing codebase)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  title: string;
  data: SomeDataType[];
}

const MyComponent: React.FC<ComponentProps> = ({ title, data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => (
          <div key={index} className="mb-4">
            {/* Content */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyComponent;
```

#### Authentication Integration
Always integrate with the AuthContext for user-related functionality:

```tsx
// Pattern from existing components
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      Welcome, {user?.firstName} {user?.lastName}
    </div>
  );
};
```

#### Protected Routes Pattern
Use the established ProtectedRoute component for route protection:

```tsx
// From App.tsx - follow this pattern
<Route 
  path="/customer" 
  element={
    <ProtectedRoute requiredUserType="customer">
      <CustomerDashboard />
    </ProtectedRoute>
  } 
/>
```

### TypeScript Guidelines

#### Interface Definitions
Always define interfaces for component props, following project patterns:

```typescript
// User interface from AuthContext
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'customer' | 'admin';
  companyName?: string;
  phone?: string;
}
```

#### Component Props
Follow the project's prop typing pattern:

```typescript
interface ComponentProps {
  title: string;
  isActive?: boolean;
  onAction: (id: string) => void;
  data: Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive';
  }>;
}
```

### Tailwind CSS Standards

#### Component Styling Pattern
Follow the established Tailwind patterns used throughout the project:

```tsx
// Dashboard card pattern from existing components
<Card className="bg-white shadow-sm border border-gray-200">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold text-gray-900">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    <div className="space-y-4">
      {/* Content */}
    </div>
  </CardContent>
</Card>
```

#### Button Variants
Use established button patterns:

```tsx
// Primary action
<Button className="bg-blue-600 hover:bg-blue-700">
  Primary Action
</Button>

// Secondary action  
<Button variant="outline" className="border-gray-300 text-gray-700">
  Secondary Action
</Button>
```

### Routing & Navigation

#### Router Structure
Maintain the established routing pattern from App.tsx:

1. Public routes (/, /signin)
2. Protected customer routes (wrapped with ProtectedRoute)
3. Protected admin routes (wrapped with ProtectedRoute)
4. Catch-all 404 route (must be last)

---

## 🌐 Backend Development

### Project Structure
Maintain the established modular structure:

```
/backend/src
  /controllers     # Route handlers
  /middleware      # Auth, validation, error handling
  /models          # Mongoose schemas
  /routes          # Express route definitions
  /types           # TypeScript interfaces
  /config          # Database and app configuration
  index.ts         # Express app entry point
```

### Type System Integration

#### Use Centralized Types
Always import from the comprehensive type definitions:

```typescript
// Import from centralized types
import { 
  IUser, 
  IBooking, 
  ApiResponse, 
  AuthRequest,
  JWTPayload 
} from '../types';
```

#### Controller Response Pattern
Follow the established ApiResponse pattern:

```typescript
// From existing authController.ts
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: (user._id as string).toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        companyName: user.companyName,
        phone: user.phone
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};
```

### Authentication Middleware

#### JWT Authentication Pattern
Use the established authentication middleware:

```typescript
// From existing auth.ts middleware
import { authenticate, authorize } from '../middleware/auth';

// Apply to protected routes
router.get('/profile', authenticate, getProfile);
router.get('/admin-only', authenticate, authorize(['admin']), adminController);
```

#### Type-Safe Request Extension
Use the AuthRequest interface for authenticated routes:

```typescript
// Pattern from existing middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: string;
  };
}
```

### Database Patterns

#### Schema Definition
Follow the comprehensive schema pattern with TypeScript interfaces:

```typescript
// Pattern from existing User model
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  // ... other fields
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // ... other fields
});

export default model<IUser>('User', userSchema);
```

#### MongoDB ObjectId Handling
Handle ObjectId type assertions properly:

```typescript
// Type-safe ObjectId conversion pattern
const userId = (user._id as string).toString();
```

### Error Handling

#### Centralized Error Middleware
Use the established error handling pattern:

```typescript
// From existing errorHandler.ts
const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Standardized error processing
  let error = { ...err };
  error.message = err.message;
  
  // Handle specific error types
  if (err.name === 'CastError') {
    // MongoDB ObjectId errors
  }
  if (err.code === 11000) {
    // Duplicate key errors
  }
  // ... other error types
};
```

---

## 🔐 Authentication & Security

### JWT Implementation
Follow the established JWT patterns:

```typescript
// Token generation (from authController.ts)
const generateToken = (userId: string, userType: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId, userType },
    jwtSecret,
    { expiresIn: '7d' }
  );
};
```

### Protected Route Patterns

#### Frontend Protection
Use the ProtectedRoute component pattern:

```tsx
// Component-level protection
<ProtectedRoute requiredUserType="admin">
  <AdminOnlyComponent />
</ProtectedRoute>
```

#### Backend Protection
Apply middleware consistently:

```typescript
// Route-level protection
router.get('/admin-data', authenticate, authorize(['admin']), controller);
```

### Role-Based Access Control
Follow the established role system:

- **Customer**: Access to bookings, tracking, profile
- **Admin**: Full system access, user management, analytics

---

## 📋 Code Patterns & Standards

### Import Organization
Follow the established import order:

```typescript
// 1. External libraries
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

// 2. UI components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 3. Internal components
import ProtectedRoute from '@/components/ProtectedRoute';

// 4. Types and utilities
import { User } from '@/types';
```

### Array Operations
Use functional array methods consistently:

```typescript
// Pattern from existing components
{data.map((item, index) => (
  <div key={item.id || index}>
    {item.name}
  </div>
))}

// Filtering and finding
const activeItems = items.filter(item => item.status === 'active');
const selectedItem = items.find(item => item.id === selectedId);
```

### Async/Await Patterns
Consistent async handling:

```typescript
// Backend controllers
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingData = req.body;
    const newBooking = await Booking.create(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};
```

---

## 📁 File Structure & Naming

### Frontend File Naming
- **Components**: PascalCase (`CustomerDashboard.tsx`)
- **Pages**: PascalCase (`CustomerDashboard.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.tsx`)
- **Utilities**: camelCase (`utils.ts`)

### Backend File Naming
- **Controllers**: camelCase (`authController.ts`)
- **Models**: PascalCase (`User.ts`)
- **Middleware**: camelCase (`auth.ts`)
- **Routes**: camelCase (`authRoutes.ts`)

### Directory Structure Consistency
Maintain the established structure:

```
/frontend/src
  /components
    /ui           # shadcn/ui components
    /admin        # Admin-specific components
    /customer     # Customer-specific components
  /pages          # Route components
  /contexts       # React contexts
  /hooks          # Custom hooks
  /lib            # Utilities
```

---

## 🎯 Development Guidelines

### 1. Context-Aware Development
- Always check existing patterns before creating new ones
- Use established components and utilities
- Follow the type definitions in `/backend/src/types/index.ts`

### 2. Database Integration
- Use Mongoose models with proper TypeScript interfaces
- Handle ObjectId type conversions properly
- Follow the established schema patterns

### 3. API Development
- Use the ApiResponse interface for consistent responses
- Apply proper authentication middleware
- Handle errors with the centralized error handler

### 4. Testing Considerations
- Write testable code with clear separation of concerns
- Use dependency injection where appropriate
- Follow the established patterns for easier testing

### 5. Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Use MongoDB indexes appropriately

---

**Remember**: This codebase has established patterns and conventions. Always reference existing code for consistency and maintain the high-quality standards already in place.