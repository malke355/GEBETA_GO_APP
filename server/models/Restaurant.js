import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Please add item name'],
  },
  price: {
    type: Number,
    required: [true, 'Please add item price'],
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: [
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
    ],
    default: 'Traditional',
  },
});

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add restaurant name'],
      unique: true,
    },
    cuisineType: {
      type: String,
      default: 'Ethiopian',
    },
    city: {
      type: String,
      enum: ['Addis Ababa', 'Jimma', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa'],
      default: 'Addis Ababa',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    deliveryTime: {
      type: Number,
      default: 30,
    },
    deliveryFee: {
      type: Number,
      default: 50,
    },
    location: {
      address: { type: String, default: '' },
      lat: { type: Number, default: 9.003 },
      lng: { type: Number, default: 38.788 },
    },
    menu: [menuItemSchema],
  },
  {
    timestamps: true,
  },
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
