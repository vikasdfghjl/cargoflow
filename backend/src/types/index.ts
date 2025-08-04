import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  phone?: string;
  companyName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
}

// Driver types
export interface IDriver extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  experience: number; // in years
  rating: number;
  totalDeliveries: number;
  status: 'active' | 'inactive' | 'suspended';
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number; // in kg
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  certifications: string[];
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: Date;
    availableTo?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Booking types
export interface IBooking extends Document {
  _id: Types.ObjectId;
  bookingId: string; // CF123456789
  customerId: Types.ObjectId;
  driverId?: Types.ObjectId;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: [number, number];
  };
  packageDetails: {
    type: string;
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description?: string;
    specialInstructions?: string;
  };
  serviceType: 'standard' | 'express' | 'premium';
  status: 'pending' | 'confirmed' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled';
  pricing: {
    basePrice: number;
    taxes: number;
    totalAmount: number;
    currency: string;
  };
  timeline: {
    bookedAt: Date;
    confirmedAt?: Date;
    pickedUpAt?: Date;
    inTransitAt?: Date;
    deliveredAt?: Date;
    estimatedDelivery: Date;
  };
  tracking: {
    currentLocation?: {
      latitude: number;
      longitude: number;
      address: string;
      timestamp: Date;
    };
    statusHistory: Array<{
      status: string;
      timestamp: Date;
      location?: string;
      notes?: string;
    }>;
  };
  recipient: {
    name: string;
    phone: string;
    email?: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  rating?: {
    score: number;
    feedback?: string;
    ratedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Address types
export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  landmark?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice types
export interface IInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string; // INV-2025-001
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentDetails?: {
    method: string;
    transactionId: string;
    paidAt: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request interface for authentication
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    userType: 'customer' | 'admin';
    email?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | ErrorDetails;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query parameters for filtering and pagination
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  phone?: string;
  companyName?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'customer' | 'admin';
  iat?: number;
  exp?: number;
}

// Email types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Error handling types
export interface ErrorDetails {
  name?: string;
  statusCode?: number;
  status?: string;
  stack?: string;
  path?: string;
  value?: any;
  keyValue?: any;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
}

// Enhanced API Response with better error handling
export interface StandardApiResponse<T = any> extends ApiResponse<T> {
  timestamp?: string;
  path?: string;
  requestId?: string;
}
