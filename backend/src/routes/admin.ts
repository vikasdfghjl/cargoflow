import express from 'express';
import {
  getAllCustomers,
  getCustomerDetails,
  updateCustomerStatus,
  getDashboardStats,
  getCustomerBookings,
  updateCustomer
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { 
  validateMongoId,
  validatePagination
} from '../middleware/validation';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Custom validation for customer ID parameter
const validateCustomerId = [
  param('customerId')
    .isMongoId()
    .withMessage('Invalid customer ID format'),
  validateRequest
];

// Update customer status validation
const validateUpdateCustomerStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  validateRequest
];

// Update customer details validation
const validateUpdateCustomer = [
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
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  body('companyAddress')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company address must not exceed 200 characters'),
  body('businessType')
    .optional()
    .trim()
    .isIn(['manufacturer', 'distributor', 'retailer', 'importer', 'exporter', 'logistics', 'other'])
    .withMessage('Invalid business type'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  validateRequest
];

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Customer management
router.get('/customers', validatePagination, getAllCustomers);
router.get('/customers/:customerId', validateCustomerId, getCustomerDetails);
router.get('/customers/:customerId/bookings', validateCustomerId, validatePagination, getCustomerBookings);
router.put('/customers/:customerId', validateCustomerId, validateUpdateCustomer, updateCustomer);

router.patch('/customers/:customerId/status', 
  validateCustomerId, 
  validateUpdateCustomerStatus, 
  updateCustomerStatus
);

export default router;
