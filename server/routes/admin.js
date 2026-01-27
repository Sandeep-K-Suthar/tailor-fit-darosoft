import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import Customer from '../models/customer.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Admin JWT Secret (different from customer)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'tailor-fit-admin-secret-2026';
const JWT_EXPIRES_IN = '24h';

// Admin invite code (used for registering new admins)
// In production, this should be in environment variables
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'TAILORFIT-ADMIN-2026';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, isAdmin: true }, ADMIN_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Admin auth middleware
export const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized - no token' });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    if (!decoded.isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized - not admin' });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin not found or inactive' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized - invalid token' });
  }
};

// Super admin middleware
export const requireSuperAdmin = async (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

// Register new admin (requires invite code)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    // Verify invite code
    if (inviteCode !== ADMIN_INVITE_CODE) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code',
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'An admin with this email already exists',
      });
    }

    // Check if this is the first admin (make them super_admin)
    const adminCount = await Admin.countDocuments();
    const role = adminCount === 0 ? 'super_admin' : 'admin';

    // Create admin
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create admin account',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin with password
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated',
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

// Get current admin
router.get('/me', protectAdmin, async (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      lastLogin: req.admin.lastLogin,
    },
  });
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists, a reset token has been generated',
      });
    }

    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // In production, send this via email
    // For now, we'll return it (only for development)
    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken, // Remove this in production - send via email instead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const admin = await Admin.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    admin.password = newPassword;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
});

// Change password (logged in admin)
router.patch('/change-password', protectAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    admin.password = newPassword;
    await admin.save();

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

// Customer Management

// Get all customers (admin only)
router.get('/customers', protectAdmin, async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const customers = await Customer.find(query)
      .select('-savedDesigns -savedMeasurements')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      count: customers.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    });
  }
});

// Get single customer details
router.get('/customers/:id', protectAdmin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
    });
  }
});

// Admin reset of customer password
router.post('/customers/:id/reset-password', protectAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: `Password reset for ${customer.email}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
});

// Update customer info
router.patch('/customers/:id', protectAdmin, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      message: 'Customer updated',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
    });
  }
});

// Admin Management (Super Admin only)

// List all admins
router.get('/list', protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
    });
  }
});

// Deactivate admin
router.patch('/:id/deactivate', protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate yourself',
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      message: 'Admin deactivated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate admin',
    });
  }
});

// Activate admin
router.patch('/:id/activate', protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      message: 'Admin activated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to activate admin',
    });
  }
});

export default router;
