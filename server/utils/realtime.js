// Room naming is centralised here so routes and the socket server cannot drift apart.
export const rooms = {
  order: (orderId) => `order:${orderId}`,
  restaurant: (restaurantId) => `restaurant:${restaurantId}`,
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
};

export const attachIo = (app, io) => app.set('io', io);

export const getIo = (req) => req.app.get('io');

const idOf = (value) => (value && value._id ? value._id.toString() : value?.toString());

// Every party that can see an order: the customer, the restaurant, the assigned
// driver, anyone tracking the order, and admins.
const audienceFor = (order) => {
  const targets = [
    rooms.order(idOf(order._id)),
    rooms.restaurant(idOf(order.restaurantId)),
    rooms.user(idOf(order.customerId)),
    rooms.role('admin'),
  ];

  if (order.driverId) {
    targets.push(rooms.user(idOf(order.driverId)));
  }

  return targets;
};

const emitToAudience = (req, order, event, payload) => {
  const io = getIo(req);
  if (!io) {
    return;
  }
  io.to(audienceFor(order)).emit(event, payload);
};

export const emitNewOrder = (req, order) => {
  const io = getIo(req);
  if (!io) {
    return;
  }
  io.to([rooms.restaurant(idOf(order.restaurantId)), rooms.role('admin')]).emit('new_order', order);
};

export const emitOrderUpdate = (req, order) => {
  emitToAudience(req, order, 'order_status_updated', {
    orderId: idOf(order._id),
    status: order.status,
    order,
  });
};

export const emitPaymentUpdate = (req, order) => {
  emitToAudience(req, order, 'payment_status_updated', {
    orderId: idOf(order._id),
    paymentStatus: order.paymentStatus,
    order,
  });
};

// Broadcast to idle drivers so unassigned jobs appear without a page refresh.
export const emitJobAvailable = (req, order) => {
  const io = getIo(req);
  if (!io) {
    return;
  }
  io.to([rooms.role('driver'), rooms.role('admin')]).emit('new_job', order);
};

export const emitDriverLocation = (req, orderId, location) => {
  const io = getIo(req);
  if (!io) {
    return;
  }
  io.to(rooms.order(idOf(orderId))).emit('driver_location_changed', {
    orderId: idOf(orderId),
    location,
  });
};
