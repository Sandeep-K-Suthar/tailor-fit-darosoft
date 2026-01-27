import express from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/customer.js';
import Order from '../models/order.js';

const router = express.Router();

// Customer Auth Routes

// Secret key for JWT (use env var in production)
const JWT_SECRET = process.env.JWT_SECRET || 'tailor-fit-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

// Helper to sign tokens
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;
    // Check for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Verify token and attach user
    const decoded = jwt.verify(token, JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// Create a new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Prevent duplicate accounts
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create the user
    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
    });

    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create account',
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists and password matches
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');

    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(customer._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);

    // Count their orders
    const orderCount = await Order.countDocuments({ 'customer.email': customer.email });

    res.json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        savedMeasurements: customer.savedMeasurements,
        savedDesigns: customer.savedDesigns,
        orderCount,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// Update personal details
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.customer._id,
      { name, phone, address, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Get my order history
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.email': req.customer.email })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});

// Add new measurements
router.post('/measurements', protect, async (req, res) => {
  try {
    const { label, ...measurements } = req.body;

    const customer = await Customer.findById(req.customer._id);

    // Turn off old defaults if this one is default
    if (measurements.isDefault) {
      customer.savedMeasurements.forEach(m => m.isDefault = false);
    }

    customer.savedMeasurements.push({ label, ...measurements });
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Measurements saved',
      data: customer.savedMeasurements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save measurements',
    });
  }
});

// Remove a measurement profile
router.delete('/measurements/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.savedMeasurements.pull(req.params.id);
    await customer.save();

    res.json({
      success: true,
      message: 'Measurements deleted',
      data: customer.savedMeasurements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete measurements',
    });
  }
});

// Save a design draft
router.post('/designs', protect, async (req, res) => {
  try {
    const design = req.body;

    const customer = await Customer.findById(req.customer._id);
    customer.savedDesigns.push(design);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Design saved to your account',
      data: customer.savedDesigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save design',
    });
  }
});

// Delete a saved design
router.delete('/designs/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.savedDesigns.pull(req.params.id);
    await customer.save();

    res.json({
      success: true,
      message: 'Design deleted',
      data: customer.savedDesigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete design',
    });
  }
});

// Update password
router.patch('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findById(req.customer._id).select('+password');

    if (!(await customer.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
});

export default router;
