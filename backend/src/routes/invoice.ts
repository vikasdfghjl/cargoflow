import express from 'express';
import {
  getAllInvoices,
  getInvoiceDetails,
  createInvoice,
  updateInvoice,
  generateInvoiceFromBookings,
  deleteInvoice,
  getInvoiceStats
} from '../controllers/invoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { 
  validateMongoId,
  validatePagination
} from '../middleware/validation';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Custom validation for invoice ID parameter
const validateInvoiceId = [
  param('invoiceId')
    .isMongoId()
    .withMessage('Invalid invoice ID format'),
  validateRequest
];

// Create invoice validation
const validateCreateInvoice = [
  body('customerId')
    .isMongoId()
    .withMessage('Invalid customer ID format'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description must be between 1 and 200 characters'),
  body('items.*.quantity')
    .isFloat({ min: 0 })
    .withMessage('Item quantity must be a positive number'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('items.*.amount')
    .isFloat({ min: 0 })
    .withMessage('Item amount must be a positive number'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('paymentTerms')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment terms must be between 1 and 50 characters'),
  validateRequest
];

// Update invoice validation
const validateUpdateInvoice = [
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description must be between 1 and 200 characters'),
  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item quantity must be a positive number'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('items.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item amount must be a positive number'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid invoice status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('paymentTerms')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment terms must be between 1 and 50 characters'),
  validateRequest
];

// Generate invoice from bookings validation
const validateGenerateFromBookings = [
  body('customerId')
    .isMongoId()
    .withMessage('Invalid customer ID format'),
  body('bookingIds')
    .isArray({ min: 1 })
    .withMessage('At least one booking ID is required'),
  body('bookingIds.*')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validateRequest
];

// All invoice routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Invoice statistics
router.get('/stats', getInvoiceStats);

// Invoice management
router.get('/', validatePagination, getAllInvoices);
router.post('/', validateCreateInvoice, createInvoice);
router.post('/generate-from-bookings', validateGenerateFromBookings, generateInvoiceFromBookings);

router.get('/:invoiceId', validateInvoiceId, getInvoiceDetails);
router.put('/:invoiceId', validateInvoiceId, validateUpdateInvoice, updateInvoice);
router.delete('/:invoiceId', validateInvoiceId, deleteInvoice);

export default router;
