import { log } from '../lib/logger';
import mongoose, { Schema, Document } from 'mongoose';

// Invoice interface for the model
export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: mongoose.Types.ObjectId;
  bookingIds: mongoose.Types.ObjectId[];
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    bookingId?: mongoose.Types.ObjectId;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  paymentTerms: string;
  sentAt?: Date;
  paidAt?: Date;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  bookingIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    required: true
  },
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    amount: {
      type: Number,
      required: [true, 'Item amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  paymentTerms: {
    type: String,
    required: [true, 'Payment terms are required'],
    default: 'Net 30',
    trim: true
  },
  sentAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate invoice number automatically
invoiceSchema.pre<IInvoice>('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const InvoiceModel = this.constructor as mongoose.Model<IInvoice>;
      const count = await InvoiceModel.countDocuments({
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      });
      
      this.invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
  log.error('Error generating invoice number', { error: (error as Error).message });
      return next(error as mongoose.CallbackError);
    }
  }
  next();
});

// Index for faster queries
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });

const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;
