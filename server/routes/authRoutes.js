import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import env from '../config/env.js';

const router = express.Router();

// Admin accounts are provisioned by the seeder or an existing admin, never by
// self-registration, so the public endpoint must not accept the admin role.
const SELF_SERVICE_ROLES = ['customer', 'restaurant', 'driver'];
const ETHIOPIAN_PHONE = /^\+2519\d{8}$/;

const generateToken = (id) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const toPublicUser = (user) => ({
  id: String(user._id),
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  phone: user.phone,
  isSuspended: user.isSuspended,
});

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional({ values: 'falsy' })
    .isIn(SELF_SERVICE_ROLES)
    .withMessage('Role must be customer, restaurant or driver'),
  body('address').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(ETHIOPIAN_PHONE)
    .withMessage('Phone must be +2519 followed by 8 digits'),
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role')
    .optional({ values: 'falsy' })
    .isIn(['customer', 'restaurant', 'driver', 'admin'])
    .withMessage('Role must be customer, restaurant, driver or admin'),
];

// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post(
  '/register',
  authLimiter,
  registerValidators,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, address, phone } = req.body;
    const role = SELF_SERVICE_ROLES.includes(req.body.role) ? req.body.role : 'customer';

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError(400, 'User already exists');
    }

    const user = await User.create({ name, email, password, role, address, phone });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: toPublicUser(user),
    });
  }),
);

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
router.post(
  '/login',
  authLimiter,
  loginValidators,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // The role check runs after the password check so it cannot be used to
    // enumerate which roles a given email is registered under.
    if (req.body.role && user.role !== req.body.role) {
      throw new ApiError(
        401,
        `Access denied: This account is registered as a ${user.role}, not a ${req.body.role}.`,
      );
    }

    if (user.isSuspended) {
      throw new ApiError(403, 'This account has been suspended');
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: toPublicUser(user),
    });
  }),
);

// @route GET /api/auth/me
// @desc Get current logged in user
// @access Private
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, user: toPublicUser(req.user) });
  }),
);

export default router;
