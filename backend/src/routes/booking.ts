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
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/auth';
import { 
  validateCreateBooking,
  validateDraftBooking,
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
router.get('/admin/all', authorize('admin'), validatePagination, getAllBookings);
router.get('/:id', validateMongoId, getBookingById);
router.delete('/:id', validateMongoId, deleteBooking);
router.patch('/:id/status', validateMongoId, validateUpdateBookingStatus, updateBookingStatus);
router.patch('/admin/:id/status', authorize('admin'), validateMongoId, validateUpdateBookingStatus, updateBookingStatus);

// Draft operations
router.post('/draft', validateDraftBooking, saveDraft);
router.get('/drafts', validatePagination, getUserDrafts);
router.get('/draft/:sessionId', getDraft);
router.delete('/draft/:sessionId', deleteDraft);
router.put('/draft/:sessionId', validateDraftBooking, autoSaveDraft);

export default router;
