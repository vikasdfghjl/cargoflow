import express from 'express';
import {
  createBooking,
  saveDraft,
  getDraft,
  getUserDrafts,
  deleteDraft,
  autoSaveDraft,
  getUserBookings,
  getBookingById,
  getAllBookings,
  updateBookingStatus
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { 
  validateCreateBooking,
  validateMongoId,
  validatePagination,
  validateUpdateBookingStatus
} from '../middleware/validation';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// Booking operations
router.post('/', validateCreateBooking, createBooking);
router.get('/', validatePagination, getUserBookings);
router.get('/all-bookings', validatePagination, getAllBookings);
router.get('/:id', validateMongoId, getBookingById);
router.patch('/:id/status', validateMongoId, validateUpdateBookingStatus, updateBookingStatus);

// Draft operations
router.post('/draft', validateCreateBooking, saveDraft);
router.get('/drafts', validatePagination, getUserDrafts);
router.get('/draft/:sessionId', getDraft);
router.delete('/draft/:sessionId', deleteDraft);
router.put('/draft/:sessionId', validateCreateBooking, autoSaveDraft);

export default router;
