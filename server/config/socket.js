import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { verifyToken } from '../middleware/auth.js';
import { rooms } from '../utils/realtime.js';
import env from './env.js';

const isValidCoordinate = (location) =>
  location &&
  Number.isFinite(Number(location.lat)) &&
  Number.isFinite(Number(location.lng)) &&
  Math.abs(Number(location.lat)) <= 90 &&
  Math.abs(Number(location.lng)) <= 180;

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || env.clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Sockets carry the same identity as REST requests, so an anonymous client can
  // no longer join arbitrary rooms or broadcast on another user's behalf.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name role isSuspended');
      if (!user || user.isSuspended) {
        return next(new Error('Account is not active'));
      }

      socket.user = { id: user._id.toString(), role: user.role, name: user.name };
      return next();
    } catch {
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.user;

    socket.join(rooms.user(userId));
    socket.join(rooms.role(role));

    if (role === 'restaurant') {
      const owned = await Restaurant.findOne({ ownerId: userId }).select('_id');
      if (owned) {
        socket.join(rooms.restaurant(owned._id.toString()));
      }
    }

    socket.on('join_restaurant', async (restaurantId) => {
      if (role !== 'restaurant' && role !== 'admin') {
        return;
      }
      if (!mongoose.isValidObjectId(restaurantId)) {
        return;
      }

      const owned = await Restaurant.findOne({
        _id: restaurantId,
        ...(role === 'admin' ? {} : { ownerId: userId }),
      }).select('_id');
      if (owned) {
        socket.join(rooms.restaurant(restaurantId));
      }
    });

    socket.on('join_order', async (orderId) => {
      try {
        const order = await Order.findById(orderId)
          .select('customerId driverId restaurantId')
          .populate('restaurantId', 'ownerId');
        if (!order) {
          return;
        }

        const isParticipant =
          order.customerId?.toString() === userId ||
          order.driverId?.toString() === userId ||
          order.restaurantId?.ownerId?.toString() === userId ||
          role === 'admin';

        if (isParticipant) {
          socket.join(rooms.order(orderId));
        }
      } catch {
        // A malformed id is simply ignored rather than dropping the connection.
      }
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(rooms.order(orderId));
    });

    socket.on('stream_driver_location', async ({ orderId, location } = {}) => {
      if (role !== 'driver' || !orderId || !isValidCoordinate(location)) {
        return;
      }

      const order = await Order.findById(orderId).select('driverId status');
      if (!order || order.driverId?.toString() !== userId) {
        return;
      }
      if (!['dispatched', 'picked_up'].includes(order.status)) {
        return;
      }

      const point = { lat: Number(location.lat), lng: Number(location.lng) };
      io.to(rooms.order(orderId)).emit('driver_location_changed', { orderId, location: point });
    });
  });

  return io;
};

export default createSocketServer;
