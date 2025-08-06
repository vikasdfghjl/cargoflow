import { Schema, model } from 'mongoose';
import { IAddress } from '../types';

const addressSchema = new Schema<IAddress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['home', 'office', 'warehouse', 'other'],
    required: true,
    default: 'home'
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'India'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: 200
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Google Maps integration fields
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  formattedAddress: {
    type: String,
    trim: true,
    maxlength: 300
  },
  placeId: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

// Index for efficient queries
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ userId: 1, type: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other addresses of the same user
    await model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default model<IAddress>('Address', addressSchema);
