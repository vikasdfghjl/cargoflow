import mongoose, { Schema, Document } from 'mongoose';
import { IDriver } from '../types';

export { IDriver };

const driverSchema = new Schema<IDriver>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please enter a valid phone number'
    ]
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'License expiry date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'License expiry date must be in the future'
    }
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Total deliveries cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    required: [true, 'Status is required']
  },
  vehicle: {
    number: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['truck', 'van', 'bike', 'car'],
      required: [true, 'Vehicle type is required']
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Vehicle capacity must be at least 1 kg']
    }
  },
  currentLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      trim: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  certifications: [{
    type: String,
    trim: true
  }],
  documents: {
    license: {
      type: String,
      required: [true, 'License document is required']
    },
    insurance: {
      type: String,
      required: [true, 'Insurance document is required']
    },
    registration: {
      type: String,
      required: [true, 'Vehicle registration document is required']
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: {
      type: Date
    },
    availableTo: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
driverSchema.index({ status: 1, 'availability.isAvailable': 1 });
driverSchema.index({ rating: -1, totalDeliveries: -1 });
driverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
driverSchema.index({ 'vehicle.type': 1, 'vehicle.capacity': 1 });

// Virtual for full name
driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update location timestamp
driverSchema.pre('save', function(next) {
  if (this.isModified('currentLocation.latitude') || this.isModified('currentLocation.longitude')) {
    this.currentLocation!.lastUpdated = new Date();
  }
  next();
});

export default mongoose.model<IDriver>('Driver', driverSchema);
