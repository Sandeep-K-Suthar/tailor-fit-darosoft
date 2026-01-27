import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const measurementsSchema = new mongoose.Schema({
  label: { type: String, default: 'Default' },
  chest: Number,
  waist: Number,
  hips: Number,
  shoulders: Number,
  sleeveLength: Number,
  shirtLength: Number,
  neck: Number,
  inseam: Number,
  thigh: Number,
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const savedDesignSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  productCategory: String,
  baseImage: String,
  fabric: {
    id: String,
    name: String,
    image: String,
  },
  styles: mongoose.Schema.Types.Mixed,
  measurements: mongoose.Schema.Types.Mixed,
  totalPrice: Number,
  savedAt: { type: Date, default: Date.now },
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Pakistan' },
  },
  savedMeasurements: [measurementsSchema],
  savedDesigns: [savedDesignSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
customerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = Date.now();
});

// Compare password method
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
customerSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
