import express from 'express';
import {
  register,
  login,
  logout,
  getProfile
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validateRegister, 
  validateLogin 
} from '../middleware/validation';

const router = express.Router();

// Authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;
