import express from 'express';
import { param } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const router = express.Router();

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
