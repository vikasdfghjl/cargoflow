import express from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/addressController';
import { authenticate } from '../middleware/auth';
import { 
  validateCreateAddress,
  validateUpdateAddress,
  validateMongoId,
  validatePagination
} from '../middleware/validation';

const router = express.Router();

// All address routes require authentication
router.use(authenticate);

// Address operations
router.get('/', validatePagination, getAddresses);
router.post('/', validateCreateAddress, createAddress);
router.put('/:id', validateMongoId, validateUpdateAddress, updateAddress);
router.delete('/:id', validateMongoId, deleteAddress);
router.patch('/:id/default', validateMongoId, setDefaultAddress);

export default router;
