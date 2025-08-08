import express from 'express';
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  updateDriverLocation,
  updateDriverAvailability,
  getAvailableDrivers,
  getDriverStatistics,
  assignDriverToBooking,
  getDriverBookings,
  getDriverPerformance
} from '../controllers/driverController';
import { authenticate, authorize } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Validation middleware
const validateDriverId = [
  param('driverId')
    .isMongoId()
    .withMessage('Invalid driver ID format'),
  validateRequest
];

const validateCreateDriver = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  body('licenseExpiry')
    .isISO8601()
    .withMessage('Please provide a valid license expiry date'),
  body('experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('vehicle.number')
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage('Vehicle number must be between 3 and 15 characters'),
  body('vehicle.type')
    .isIn(['truck', 'van', 'bike', 'car'])
    .withMessage('Vehicle type must be one of: truck, van, bike, car'),
  body('vehicle.model')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle model must be between 2 and 50 characters'),
  body('vehicle.capacity')
    .isInt({ min: 1 })
    .withMessage('Vehicle capacity must be at least 1 kg'),
  body('documents.license')
    .notEmpty()
    .withMessage('License document is required'),
  body('documents.insurance')
    .notEmpty()
    .withMessage('Insurance document is required'),
  body('documents.registration')
    .notEmpty()
    .withMessage('Registration document is required'),
  validateRequest
];

const validateUpdateDriver = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  body('licenseExpiry')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid license expiry date'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be one of: active, inactive, suspended'),
  body('vehicle.number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage('Vehicle number must be between 3 and 15 characters'),
  body('vehicle.type')
    .optional()
    .isIn(['truck', 'van', 'bike', 'car'])
    .withMessage('Vehicle type must be one of: truck, van, bike, car'),
  body('vehicle.model')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle model must be between 2 and 50 characters'),
  body('vehicle.capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Vehicle capacity must be at least 1 kg'),
  validateRequest
];

const validateUpdateDriverStatus = [
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be one of: active, inactive, suspended'),
  validateRequest
];

const validateUpdateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  validateRequest
];

const validateUpdateAvailability = [
  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean value'),
  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid available from date'),
  body('availableTo')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid available to date'),
  validateRequest
];

const validateCoordinates = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('vehicleType')
    .optional()
    .isIn(['truck', 'van', 'bike', 'car'])
    .withMessage('Vehicle type must be one of: truck, van, bike, car'),
  query('minCapacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum capacity must be at least 1 kg'),
  query('radius')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Radius must be between 1 and 500 km'),
  validateRequest
];

const validatePagination = [
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
    .isIn(['createdAt', 'firstName', 'lastName', 'rating', 'experience', 'totalDeliveries'])
    .withMessage('Sort by must be one of: createdAt, firstName, lastName, rating, experience, totalDeliveries'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  validateRequest
];

const validateAssignDriver = [
  body('driverId')
    .isMongoId()
    .withMessage('Invalid driver ID format'),
  body('bookingId')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  validateRequest
];

// Public routes (for mobile app drivers)
router.get('/available', validateCoordinates, getAvailableDrivers);

// Admin-only routes
router.use(authenticate);
router.use(authorize('admin'));

// CRUD operations
router.post('/', validateCreateDriver, createDriver);
router.get('/', validatePagination, getAllDrivers);
router.get('/statistics', getDriverStatistics);
router.get('/:driverId', validateDriverId, getDriverById);
router.put('/:driverId', validateDriverId, validateUpdateDriver, updateDriver);
router.delete('/:driverId', validateDriverId, deleteDriver);

// Status and availability management
router.patch('/:driverId/status', validateDriverId, validateUpdateDriverStatus, updateDriverStatus);
router.patch('/:driverId/location', validateDriverId, validateUpdateLocation, updateDriverLocation);
router.patch('/:driverId/availability', validateDriverId, validateUpdateAvailability, updateDriverAvailability);

// Assignment and tracking
router.post('/assign', validateAssignDriver, assignDriverToBooking);
router.get('/:driverId/bookings', validateDriverId, getDriverBookings);
router.get('/:driverId/performance', validateDriverId, getDriverPerformance);

export default router;
