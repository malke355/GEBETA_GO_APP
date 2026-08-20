import express from 'express';
import { body, param, query } from 'express-validator';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect, authorize('admin'));

const isBooleanBody = (field) =>
  body(field)
    .custom((value) => value === true || value === false)
    .withMessage(`${field} is required`);

const toPublicUser = (user) => ({
  id: String(user._id),
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  isSuspended: user.isSuspended,
  createdAt: user.createdAt,
});

// @route GET /api/admin/stats
// @desc Platform analytics
// @access Private (Admin)
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalRestaurants, totalOrders, statusAggregation, revenueAggregation] =
      await Promise.all([
        User.countDocuments({}),
        Restaurant.countDocuments({}),
        Order.countDocuments({}),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]),
      ]);

    const statusCounts = {
      placed: 0,
      confirmed: 0,
      prepared: 0,
      dispatched: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0,
    };
    statusAggregation.forEach(({ _id, count }) => {
      if (_id in statusCounts) {
        statusCounts[_id] = count;
      }
    });

    const totalRevenue = revenueAggregation[0]?.total || 0;

    const restaurantSales = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: '$restaurantId', sales: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      { $sort: { sales: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' },
      },
      { $unwind: '$restaurant' },
      {
        $project: {
          _id: 0,
          name: '$restaurant.name',
          cuisine: '$restaurant.cuisineType',
          sales: 1,
          orderCount: 1,
        },
      },
    ]);

    const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          totalRevenue,
          platformCommission: totalRevenue * 0.15,
          completedOrders: revenueAggregation[0]?.count || 0,
        },
        statusCounts,
        restaurantSales,
        usersByRole: usersByRole.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
      },
    });
  }),
);

// @route GET /api/admin/users
// @desc List users with search and pagination
// @access Private (Admin)
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional({ values: 'falsy' }).isIn(['customer', 'restaurant', 'driver', 'admin']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = (req.query.search || '').trim();

    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users.map(toPublicUser),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  }),
);

// @route PUT /api/admin/users/:id
// @desc Update a user's suspension state
// @access Private (Admin)
router.put(
  '/users/:id',
  [param('id').isMongoId(), isBooleanBody('isSuspended')],
  validate,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) === req.params.id && req.body.isSuspended === true) {
      throw new ApiError(400, 'You cannot suspend your own account');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.isSuspended = req.body.isSuspended;
    await user.save();

    res.status(200).json({ success: true, data: toPublicUser(user) });
  }),
);

// @route GET /api/admin/restaurants
// @desc List every restaurant with its owner and order volume
// @access Private (Admin)
router.get(
  '/restaurants',
  asyncHandler(async (_req, res) => {
    const restaurants = await Restaurant.find({})
      .populate('ownerId', 'name email phone isSuspended')
      .sort({ createdAt: -1 });

    const orderCounts = await Order.aggregate([{ $group: { _id: '$restaurantId', count: { $sum: 1 } } }]);
    const countMap = new Map(orderCounts.map(({ _id, count }) => [_id.toString(), count]));

    const data = restaurants.map((restaurant) => ({
      ...restaurant.toObject(),
      id: String(restaurant._id),
      orderCount: countMap.get(restaurant._id.toString()) || 0,
    }));

    res.status(200).json({ success: true, data });
  }),
);

// @route PUT /api/admin/restaurants/:id
// @desc Suspend or reinstate a restaurant
// @access Private (Admin)
router.put(
  '/restaurants/:id',
  [param('id').isMongoId(), isBooleanBody('isSuspended')],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isSuspended: req.body.isSuspended },
      { new: true },
    );
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    res.status(200).json({ success: true, data: restaurant });
  }),
);

// @route GET /api/admin/orders
// @desc Order oversight with filtering and pagination
// @access Private (Admin)
router.get(
  '/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status')
      .optional({ values: 'falsy' })
      .isIn(['placed', 'confirmed', 'prepared', 'dispatched', 'picked_up', 'delivered', 'cancelled']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customerId', 'name email phone')
        .populate('restaurantId', 'name')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  }),
);

export default router;
