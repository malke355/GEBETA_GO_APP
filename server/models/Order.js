import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  imageUrl: {
    type: String,
    default: '',
  },
});

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'telebirr', 'bank_transfer'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'proof_submitted', 'verified', 'paid', 'failed'],
      default: 'pending',
    },
    paymentDetails: {
      transactionId: String,
      bankName: String,
      accountHolder: String,
      proofImageUrl: String,
    },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'prepared', 'dispatched', 'picked_up', 'delivered', 'cancelled'],
      default: 'placed',
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please add delivery address'],
    },
    deliveryCoordinates: {
      lat: { type: Number, default: 9.003 },
      lng: { type: Number, default: 38.788 },
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: '',
      maxlength: 500,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'restaurant', 'admin'],
    },
    cancelReason: {
      type: String,
      default: '',
      maxlength: 300,
    },
    deliveredAt: Date,
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
