import express from 'express';
import { body, param } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadSingle, resolveUploadedImageUrl } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const router = express.Router();

const DEFAULT_RESTAURANT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
const DEFAULT_MENU_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

const MENU_CATEGORIES = [
  'Traditional',
  'Fast Food',
  'Dessert',
  'Beverage',
  'Burger',
  'Pizza',
  'Chicken',
  'Healthy',
  'Pasta',
  'Ethiopian',
  'Sushi',
  'Drinks',
  'Desserts',
];

const getOwnedRestaurant = async (req) => {
  if (req.user.role === 'admin' && req.query.restaurantId) {
    const restaurant = await Restaurant.findById(req.query.restaurantId);
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }
    return restaurant;
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    throw new ApiError(404, 'No restaurant profile found for this account. Create a restaurant profile first.');
  }
  return restaurant;
};

const menuItemValidators = [
  body('itemName').trim().notEmpty().withMessage('Item name is required').isLength({ max: 100 }),
  body('price').isFloat({ min: 0.01, max: 100000 }).withMessage('Price must be a positive number'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('category').optional({ values: 'falsy' }).isIn(MENU_CATEGORIES).withMessage('Unknown category'),
];

const serializeReviews = (reviews) =>
  reviews.map((review) => ({
    id: String(review._id),
    rating: review.rating,
    review: review.review || '',
    customerName: review.customerId?.name || 'Customer',
    createdAt: review.createdAt,
  }));

// @route GET /api/restaurants
// @desc Get all restaurants that are not suspended
// @access Public
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const restaurants = await Restaurant.find({ isSuspended: { $ne: true } }).sort({ rating: -1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  }),
);

// @route GET /api/restaurants/mine
// @desc Get the logged in owner's restaurant
// @access Private (Restaurant / Admin)
router.get(
  '/mine',
  protect,
  authorize('restaurant', 'admin'),
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    res.status(200).json({ success: true, data: restaurant || null });
  }),
);

// @route POST /api/restaurants
// @desc Register a restaurant profile
// @access Private (Restaurant / Admin)
router.post(
  '/',
  protect,
  authorize('restaurant', 'admin'),
  uploadLimiter,
  uploadSingle('image'),
  [
    body('name').trim().notEmpty().withMessage('Restaurant name is required').isLength({ max: 100 }),
    body('cuisineType').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
    body('address').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
    body('deliveryFee').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10000 }),
    body('deliveryTime').optional({ values: 'falsy' }).isInt({ min: 1, max: 300 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, cuisineType, address, lat, lng, deliveryFee, deliveryTime, city } = req.body;

    const existing = await Restaurant.findOne({ ownerId: req.user.id });
    if (existing) {
      throw new ApiError(400, 'You have already registered a restaurant under this account');
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user.id,
      name,
      cuisineType: cuisineType || 'Ethiopian Traditional',
      city: city || 'Addis Ababa',
      imageUrl: resolveUploadedImageUrl(req) || DEFAULT_RESTAURANT_IMAGE,
      deliveryFee: Number(deliveryFee) || 50,
      deliveryTime: Number(deliveryTime) || 30,
      location: {
        address: address || '',
        lat: Number(lat) || 9.003,
        lng: Number(lng) || 38.788,
      },
    });

    res.status(201).json({ success: true, data: restaurant });
  }),
);

// @route PUT /api/restaurants/profile
// @desc Update the owner's restaurant profile
// @access Private (Restaurant / Admin)
router.put(
  '/profile',
  protect,
  authorize('restaurant', 'admin'),
  uploadLimiter,
  uploadSingle('image'),
  [
    body('name').optional({ values: 'falsy' }).trim().notEmpty().isLength({ max: 100 }),
    body('cuisineType').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
    body('address').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
    body('deliveryFee').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10000 }),
    body('deliveryTime').optional({ values: 'falsy' }).isInt({ min: 1, max: 300 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req);
    const { name, cuisineType, address, lat, lng, deliveryFee, deliveryTime, city } = req.body;

    if (name) restaurant.name = name;
    if (cuisineType) restaurant.cuisineType = cuisineType;
    if (city) restaurant.city = city;
    if (deliveryFee !== undefined && deliveryFee !== '') restaurant.deliveryFee = Number(deliveryFee);
    if (deliveryTime !== undefined && deliveryTime !== '') restaurant.deliveryTime = Number(deliveryTime);
    if (address !== undefined) restaurant.location.address = address;
    if (lat) restaurant.location.lat = Number(lat);
    if (lng) restaurant.location.lng = Number(lng);

    const imageUrl = resolveUploadedImageUrl(req);
    if (imageUrl) restaurant.imageUrl = imageUrl;

    await restaurant.save();
    res.status(200).json({ success: true, data: restaurant });
  }),
);

// @route POST /api/restaurants/menu
// @desc Add a menu item
// @access Private (Restaurant / Admin)
router.post(
  '/menu',
  protect,
  authorize('restaurant', 'admin'),
  uploadLimiter,
  uploadSingle('image'),
  menuItemValidators,
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req);
    const { itemName, price, description, category } = req.body;

    restaurant.menu.push({
      itemName,
      price: Number(price),
      description: description || '',
      category: category || 'Traditional',
      imageUrl: resolveUploadedImageUrl(req) || DEFAULT_MENU_IMAGE,
    });
    await restaurant.save();

    res.status(201).json({ success: true, data: restaurant });
  }),
);

// @route PUT /api/restaurants/menu/:itemId
// @desc Update a menu item
// @access Private (Restaurant / Admin)
router.put(
  '/menu/:itemId',
  protect,
  authorize('restaurant', 'admin'),
  uploadLimiter,
  uploadSingle('image'),
  [param('itemId').isMongoId().withMessage('Invalid menu item'), ...menuItemValidators],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req);
    const item = restaurant.menu.id(req.params.itemId);
    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    const { itemName, price, description, category } = req.body;
    item.itemName = itemName;
    item.price = Number(price);
    item.description = description || '';
    if (category) item.category = category;

    const imageUrl = resolveUploadedImageUrl(req);
    if (imageUrl) item.imageUrl = imageUrl;

    await restaurant.save();
    res.status(200).json({ success: true, data: restaurant });
  }),
);

// @route DELETE /api/restaurants/menu/:itemId
// @desc Remove a menu item
// @access Private (Restaurant / Admin)
router.delete(
  '/menu/:itemId',
  protect,
  authorize('restaurant', 'admin'),
  [param('itemId').isMongoId().withMessage('Invalid menu item')],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req);
    const item = restaurant.menu.id(req.params.itemId);
    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    item.deleteOne();
    await restaurant.save();
    res.status(200).json({ success: true, data: restaurant });
  }),
);

// @route GET /api/restaurants/:id
// @desc Get a single restaurant, with recent reviews
// @access Public
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid restaurant id')],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    const reviews = await Order.find({ restaurantId: restaurant._id, rating: { $ne: null } })
      .select('rating review createdAt')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: { ...restaurant.toObject(), reviews: serializeReviews(reviews) },
    });
  }),
);

export default router;
