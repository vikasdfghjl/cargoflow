import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from './errorHandler';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg
    }));

    throw new ValidationError(`Validation failed: ${errorMessages.map(e => `${e.field}: ${e.message}`).join(', ')}`);
  }
  
  next();
};

// Authentication validation rules
export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('userType')
    .isIn(['customer', 'admin'])
    .withMessage('User type must be either customer or admin'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-\.&]+$/)
    .withMessage('Company name contains invalid characters'),
  
  validateRequest
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validateRequest
];

// Booking validation rules
export const validateCreateBooking = [
  body('customerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  
  body('pickupAddress.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Pickup address must be between 5 and 200 characters'),
  
  body('pickupAddress.contactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Pickup contact name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Contact name can only contain letters and spaces'),
  
  body('pickupAddress.phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid pickup phone number'),
  
  body('pickupAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Pickup city must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City name can only contain letters and spaces'),
  
  body('pickupAddress.postalCode')
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pickup postal code must be a 6-digit number'),
  
  body('deliveryAddress.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Delivery address must be between 5 and 200 characters'),
  
  body('deliveryAddress.contactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Delivery contact name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Contact name can only contain letters and spaces'),
  
  body('deliveryAddress.phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid delivery phone number'),
  
  body('deliveryAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Delivery city must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City name can only contain letters and spaces'),
  
  body('deliveryAddress.postalCode')
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Delivery postal code must be a 6-digit number'),
  
  body('packageType')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Package type must be between 2 and 50 characters'),
  
  body('weight')
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Weight must be between 0.1 and 1000 kg'),
  
  body('serviceType')
    .isIn(['standard', 'express', 'same_day'])
    .withMessage('Service type must be standard, express, or same_day'),
  
  body('pickupDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid pickup date'),
  
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be less than 500 characters'),
  
  body('insurance')
    .optional()
    .isBoolean()
    .withMessage('Insurance must be a boolean value'),
  
  body('insuranceValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance value must be a positive number'),
  
  validateRequest
];

// Address validation rules
export const validateCreateAddress = [
  body('label')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Address label must be between 2 and 100 characters'),
  
  body('street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('contactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Contact name can only contain letters and spaces'),
  
  body('phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City name can only contain letters and spaces'),
  
  body('state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State name can only contain letters and spaces'),
  
  body('zipCode')
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Zip code must be a 6-digit number'),
  
  body('type')
    .isIn(['home', 'office', 'warehouse', 'other'])
    .withMessage('Address type must be home, office, warehouse, or other'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('landmark')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Landmark must be less than 200 characters'),
  
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions must be less than 500 characters'),
  
  validateRequest
];

// Parameter validation rules
export const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validateRequest
];

export const validateBookingId = [
  param('bookingId')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  
  validateRequest
];

// Query validation rules
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'totalCost', 'pickupDate'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'])
    .withMessage('Invalid status value'),
  
  validateRequest
];

// Booking status update validation
export const validateUpdateBookingStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  
  body('status')
    .isIn(['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'])
    .withMessage('Invalid status value'),
  
  body('driverId')
    .optional()
    .isMongoId()
    .withMessage('Invalid driver ID format'),
  
  validateRequest
];

// Sanitization helpers
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Additional sanitization can be added here if needed
  // express-mongo-sanitize will handle NoSQL injection prevention
  next();
};
