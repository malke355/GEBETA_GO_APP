import express from 'express';
import { body, param } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
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

// @route GET /api/restaurants
// @desc Get all restaurants that are not suspended
// @access Public
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // $ne: true rather than false, so documents created before the field
    // existed are still returned.
    const restaurants = await Restaurant.find({ isSuspended: { $ne: true } }).sort({ rating: -1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  }),
);

// @route GET /api/restaurants/mine
// @desc Get the logged in owner's restaurant
// @access Private (Restaurant / Admin)
// Declared before '/:id' so "mine" is never parsed as an object id.
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
  [
    body('name').trim().notEmpty().withMessage('Restaurant name is required').isLength({ max: 100 }),
    body('cuisineType').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
    body('address').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, cuisineType, address } = req.body;

    const existing = await Restaurant.findOne({ ownerId: req.user.id });
    if (existing) {
      throw new ApiError(400, 'You have already registered a restaurant under this account');
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user.id,
      name,
      cuisineType: cuisineType || 'Ethiopian Traditional',
      city: 'Addis Ababa',
      imageUrl: DEFAULT_RESTAURANT_IMAGE,
      deliveryFee: 50,
      deliveryTime: 30,
      location: {
        address: address || '',
        lat: 9.003,
        lng: 38.788,
      },
    });

    res.status(201).json({ success: true, data: restaurant });
  }),
);

// @route POST /api/restaurants/menu
// @desc Add a menu item
// @access Private (Restaurant / Admin)
router.post(
  '/menu',
  protect,
  authorize('restaurant', 'admin'),
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required').isLength({ max: 100 }),
    body('price').isFloat({ min: 0.01, max: 100000 }).withMessage('Price must be a positive number'),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('category').optional({ values: 'falsy' }).isIn(MENU_CATEGORIES).withMessage('Unknown category'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req);
    const { itemName, price, description, category } = req.body;

    restaurant.menu.push({
      itemName,
      price: Number(price),
      description: description || '',
      category: category || 'Traditional',
      imageUrl: DEFAULT_MENU_IMAGE,
    });
    await restaurant.save();

    res.status(201).json({ success: true, data: restaurant });
  }),
);

// @route GET /api/restaurants/:id
// @desc Get a single restaurant and its menu
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

    res.status(200).json({ success: true, data: restaurant });
  }),
);

export default router;
