import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  bookingNumber: string;
  customerId: Types.ObjectId;
  
  // Addresses
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  
  // Package Details
  packageType: 'document' | 'package' | 'fragile' | 'bulk';
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Service Details
  serviceType: 'standard' | 'express' | 'same_day';
  pickupDate: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Status
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  
  // Optional Details
  specialInstructions?: string;
  insurance: boolean;
  insuranceValue?: number;
  
  // Pricing
  baseCost: number;
  weightCharges: number;
  insuranceCharges: number;
  totalCost: number;
  
  // Tracking
  trackingNumber?: string;
  driverId?: Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
}

const bookingSchema = new Schema<IBooking>({
  bookingNumber: {
    type: String,
    unique: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Pickup Address
  pickupAddress: {
    address: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    instructions: { type: String }
  },
  
  // Delivery Address
  deliveryAddress: {
    address: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    instructions: { type: String }
  },
  
  // Package Details
  packageType: {
    type: String,
    enum: ['document', 'package', 'fragile', 'bulk'],
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0.1
  },
  dimensions: {
    length: { type: Number, min: 1 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 }
  },
  
  // Service Details
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'same_day'],
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Optional Details
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  insurance: {
    type: Boolean,
    default: false
  },
  insuranceValue: {
    type: Number,
    min: 0
  },
  
  // Pricing
  baseCost: {
    type: Number,
    required: true,
    min: 0
  },
  weightCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  insuranceCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tracking
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  // Timestamps
  confirmedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ pickupDate: 1, status: 1 });
bookingSchema.index({ trackingNumber: 1 });

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  console.log('Pre-save hook called, isNew:', this.isNew, 'bookingNumber:', this.bookingNumber);
  
  if (this.isNew && !this.bookingNumber) {
    console.log('Generating booking number...');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last booking number for today
    const BookingModel = this.constructor as any;
    const lastBooking = await BookingModel.findOne({
      bookingNumber: new RegExp(`^CPP${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking && lastBooking.bookingNumber) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.bookingNumber = `CPP${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    console.log('Generated booking number:', this.bookingNumber);
  }
  
  // Ensure booking number is always set
  if (!this.bookingNumber) {
    const error = new Error('Booking number generation failed');
    return next(error);
  }
  
  // Calculate estimated delivery date
  if (this.isNew || this.isModified('serviceType') || this.isModified('pickupDate')) {
    const pickupDate = new Date(this.pickupDate);
    let deliveryDays = 3; // Default for standard
    
    switch (this.serviceType) {
      case 'express':
        deliveryDays = 2;
        break;
      case 'same_day':
        deliveryDays = 0;
        break;
    }
    
    const estimatedDelivery = new Date(pickupDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);
    this.estimatedDeliveryDate = estimatedDelivery;
  }
  
  next();
});

// Generate tracking number when confirmed
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.trackingNumber) {
    const randomNum = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingNumber = `TRK${randomNum}${Date.now().toString().slice(-6)}`;
    this.confirmedAt = new Date();
  }
  next();
});

// Static method to generate booking statistics
bookingSchema.statics.getBookingStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await this.aggregate([
    {
      $facet: {
        totalBookings: [{ $count: "count" }],
        todayBookings: [
          { $match: { createdAt: { $gte: today } } },
          { $count: "count" }
        ],
        statusCounts: [
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ],
        monthlyRevenue: [
          { 
            $match: { 
              createdAt: { 
                $gte: new Date(today.getFullYear(), today.getMonth(), 1) 
              },
              status: { $in: ['confirmed', 'picked_up', 'in_transit', 'delivered'] }
            } 
          },
          { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]
      }
    }
  ]);
  
  return stats[0];
};

export default model<IBooking>('Booking', bookingSchema);
