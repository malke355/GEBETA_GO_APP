import express from 'express';
import { body, param } from 'express-validator';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const router = express.Router();

const ORDER_POPULATE = [
  { path: 'restaurantId', select: 'name imageUrl location ownerId deliveryFee' },
  { path: 'customerId', select: 'name phone address' },
  { path: 'driverId', select: 'name phone' },
];

// Prices and totals are always recomputed from the restaurant's stored menu so a
// tampered client payload cannot change what the customer is charged.
const buildPricedOrderLines = (restaurant, requestedItems) => {
  const lines = requestedItems.map((requested) => {
    const menuItem = restaurant.menu.id(requested.menuItemId);
    if (!menuItem) {
      throw new ApiError(400, `Menu item ${requested.menuItemId} is not available at this restaurant`);
    }

    const quantity = Math.floor(Number(requested.quantity) || 0);
    if (quantity < 1 || quantity > 50) {
      throw new ApiError(400, `Invalid quantity for ${menuItem.itemName}`);
    }

    return {
      menuItemId: menuItem._id.toString(),
      itemName: menuItem.itemName,
      price: menuItem.price,
      quantity,
      imageUrl: menuItem.imageUrl || '',
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return { lines, subtotal, totalAmount: subtotal + restaurant.deliveryFee };
};

const assertRestaurantOwnership = async (order, user) => {
  if (user.role === 'admin') {
    return;
  }

  const restaurant = await Restaurant.findOne({ ownerId: user.id });
  const restaurantId = order.restaurantId?._id?.toString() || order.restaurantId.toString();
  if (!restaurant || restaurantId !== restaurant._id.toString()) {
    throw new ApiError(403, 'Not authorized: this order does not belong to your restaurant.');
  }
};

const serializeOrder = (order) => {
  if (!order) {
    return null;
  }

  const data = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  if (data.restaurantId && typeof data.restaurantId === 'object') {
    data.restaurantName = data.restaurantName || data.restaurantId.name;
    data.restaurantAddress = data.restaurantAddress || data.restaurantId.location?.address;
  }
  return data;
};

// @route POST /api/orders
// @desc Create a new order
// @access Private (Customer only)
router.post(
  '/',
  protect,
  authorize('customer'),
  [
    body('restaurantId').isMongoId().withMessage('A valid restaurant is required'),
    body('items').isArray({ min: 1 }).withMessage('Your cart is empty'),
    body('items.*.menuItemId').notEmpty().withMessage('Each cart item needs a menu item'),
    body('items.*.quantity').isInt({ min: 1, max: 50 }).withMessage('Invalid item quantity'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('paymentMethod').optional({ values: 'falsy' }).isIn(['cash', 'telebirr', 'bank_transfer']),
    body('bankName').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { restaurantId, items, paymentMethod, deliveryAddress, lat, lng, bankName } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }
    if (restaurant.isSuspended) {
      throw new ApiError(400, 'This restaurant is not currently accepting orders');
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (
      Number.isNaN(numLat) ||
      Number.isNaN(numLng) ||
      numLat < 8.8 ||
      numLat > 9.15 ||
      numLng < 38.6 ||
      numLng > 38.95
    ) {
      throw new ApiError(
        400,
        'Delivery is restricted to Addis Ababa only. Please choose a location within the city boundaries.',
      );
    }

    const { lines, subtotal, totalAmount } = buildPricedOrderLines(restaurant, items);

    const order = await Order.create({
      customerId: req.user.id,
      restaurantId,
      items: lines,
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      paymentDetails: { bankName: bankName || '' },
      deliveryAddress,
      deliveryCoordinates: {
        lat: numLat,
        lng: numLng,
      },
    });

    const populated = await order.populate(ORDER_POPULATE);
    res.status(201).json({ success: true, data: serializeOrder(populated) });
  }),
);

// @route GET /api/orders/my-orders
// @desc Get logged in customer's orders
// @access Private
router.get(
  '/my-orders',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('restaurantId', 'name imageUrl location deliveryFee')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: orders.map(serializeOrder) });
  }),
);

// @route GET /api/orders/restaurant
// @desc Get restaurant owner's orders
// @access Private (Restaurant Owner)
router.get(
  '/restaurant',
  protect,
  authorize('restaurant', 'admin'),
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant profile not found');
    }

    const orders = await Order.find({ restaurantId: restaurant._id })
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, data: orders.map(serializeOrder) });
  }),
);

// @route GET /api/orders/driver/available
// @desc Get unassigned prepared orders
// @access Private (Driver only)
router.get(
  '/driver/available',
  protect,
  authorize('driver', 'admin'),
  asyncHandler(async (_req, res) => {
    const orders = await Order.find({ status: 'prepared', driverId: null })
      .populate('restaurantId', 'name location imageUrl')
      .populate('customerId', 'name address phone')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: orders.map(serializeOrder) });
  }),
);

// @route GET /api/orders/driver/active
// @desc Get the driver's current delivery
// @access Private (Driver only)
router.get(
  '/driver/active',
  protect,
  authorize('driver', 'admin'),
  asyncHandler(async (req, res) => {
    const activeOrder = await Order.findOne({
      driverId: req.user.id,
      status: { $in: ['dispatched', 'picked_up'] },
    })
      .populate('restaurantId', 'name location imageUrl')
      .populate('customerId', 'name address phone');

    res.status(200).json({ success: true, data: serializeOrder(activeOrder) });
  }),
);

// @route GET /api/orders/driver/history
// @desc Completed deliveries and earnings for the logged in driver
// @access Private (Driver only)
router.get(
  '/driver/history',
  protect,
  authorize('driver', 'admin'),
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ driverId: req.user.id, status: 'delivered' })
      .populate('restaurantId', 'name')
      .sort({ deliveredAt: -1, updatedAt: -1 })
      .limit(100);

    const totalEarnings = orders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(serializeOrder),
        totalDeliveries: orders.length,
        totalEarnings,
      },
    });
  }),
);

const STATUS_PERMISSIONS = {
  confirmed: ['restaurant'],
  prepared: ['restaurant'],
  picked_up: ['driver'],
  delivered: ['driver'],
};

const STATUS_TRANSITIONS = {
  confirmed: { from: 'placed', message: 'Only a new order can be confirmed' },
  prepared: { from: 'confirmed', message: 'Confirm the order before marking it prepared' },
  picked_up: { from: 'dispatched', message: 'Pick up the order after it has been dispatched' },
  delivered: { from: 'picked_up', message: 'Mark the order picked up before completing delivery' },
};

// @route PUT /api/orders/:id/accept
// @desc Driver accepts a delivery job
// @access Private (Driver only)
router.put(
  '/:id/accept',
  protect,
  authorize('driver', 'admin'),
  [param('id').isMongoId()],
  validate,
  asyncHandler(async (req, res) => {
    const existing = await Order.findOne({
      driverId: req.user.id,
      status: { $in: ['dispatched', 'picked_up'] },
    });
    if (existing) {
      throw new ApiError(400, 'Finish your current delivery before accepting another job');
    }

    // A conditional update makes the claim atomic, so two drivers racing for the
    // same job cannot both succeed.
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'prepared', driverId: null },
      { driverId: req.user.id, status: 'dispatched' },
      { new: true },
    ).populate(ORDER_POPULATE);

    if (!order) {
      throw new ApiError(400, 'This job is no longer available');
    }

    res.status(200).json({ success: true, data: serializeOrder(order) });
  }),
);

// @route PUT /api/orders/:id/status
// @desc Advance an order through the fulfilment flow
// @access Private (Restaurant / Driver / Admin)
router.put(
  '/:id/status',
  protect,
  [
    param('id').isMongoId(),
    body('status')
      .isIn(['confirmed', 'prepared', 'picked_up', 'delivered'])
      .withMessage('Unsupported status transition'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new ApiError(400, `This order is already ${order.status}`);
    }

    const allowedRoles = STATUS_PERMISSIONS[status] || [];
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'Not authorized to set this order status');
    }

    if (req.user.role === 'restaurant') {
      await assertRestaurantOwnership(order, req.user);
    }

    if (req.user.role === 'driver' && order.driverId?.toString() !== req.user.id) {
      throw new ApiError(403, 'Not authorized: you are not the driver assigned to this order.');
    }

    const transition = STATUS_TRANSITIONS[status];
    if (transition && order.status !== transition.from) {
      throw new ApiError(400, transition.message);
    }

    order.status = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cash') {
        order.paymentStatus = 'paid';
      }
    }

    await order.save();
    const populated = await order.populate(ORDER_POPULATE);
    res.status(200).json({ success: true, data: serializeOrder(populated) });
  }),
);

// @route PUT /api/orders/:id/verify-payment
// @desc Restaurant or admin confirms a submitted payment
// @access Private (Owning restaurant / Admin)
router.put(
  '/:id/verify-payment',
  protect,
  authorize('restaurant', 'admin'),
  [param('id').isMongoId(), body('approved').optional().isBoolean()],
  validate,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    await assertRestaurantOwnership(order, req.user);

    const approved = req.body.approved !== false;
    order.paymentStatus = approved ? 'verified' : 'failed';
    await order.save();

    const populated = await order.populate(ORDER_POPULATE);
    res.status(200).json({ success: true, data: serializeOrder(populated) });
  }),
);

// @route PUT /api/orders/:id/cancel
// @desc Cancel an order
// @access Private (Customer / Restaurant / Admin)
router.put(
  '/:id/cancel',
  protect,
  [param('id').isMongoId(), body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 300 })],
  validate,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new ApiError(400, `This order is already ${order.status} and cannot be cancelled`);
    }

    const { role } = req.user;

    if (role === 'customer') {
      if (order.customerId.toString() !== req.user.id) {
        throw new ApiError(403, 'Not authorized to cancel this order');
      }
      if (order.status !== 'placed') {
        throw new ApiError(400, 'This order can no longer be cancelled because the restaurant has accepted it');
      }
    } else if (role === 'restaurant') {
      await assertRestaurantOwnership(order, req.user);
      if (!['placed', 'confirmed'].includes(order.status)) {
        throw new ApiError(400, 'This order can no longer be cancelled');
      }
    } else if (role !== 'admin') {
      throw new ApiError(403, 'Not authorized to cancel this order');
    }

    order.status = 'cancelled';
    order.cancelledBy = role === 'admin' ? 'admin' : role;
    order.cancelReason = req.body.reason || '';
    await order.save();

    const populated = await order.populate(ORDER_POPULATE);
    res.status(200).json({ success: true, data: serializeOrder(populated) });
  }),
);

// @route GET /api/orders/:id
// @desc Get order details
// @access Private (Order participants and admins)
router.get(
  '/:id',
  protect,
  [param('id').isMongoId()],
  validate,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const isCustomer = order.customerId?._id?.toString() === req.user.id;
    const isDriver = order.driverId?._id?.toString() === req.user.id;
    const isRestaurantOwner = order.restaurantId?.ownerId?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isDriver && !isRestaurantOwner && !isAdmin) {
      throw new ApiError(403, 'Access denied: you are not authorized to view this order.');
    }

    res.status(200).json({ success: true, data: serializeOrder(order) });
  }),
);

export default router;
