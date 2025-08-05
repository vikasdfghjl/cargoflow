import express from 'express';
import { authenticate } from '../middleware/auth';
import { getCustomerInvoices, getCustomerInvoiceDetails } from '../controllers/invoiceController';

const router = express.Router();

// All customer routes require authentication
router.use(authenticate);

// Customer invoice routes
router.get('/invoices', getCustomerInvoices);
router.get('/invoices/:invoiceId', getCustomerInvoiceDetails);

export default router;
