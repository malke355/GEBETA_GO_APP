import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (req.user.isSuspended) {
      return res.status(403).json({ success: false, message: 'This account has been suspended' });
    }

    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `User role (${req.user?.role || 'none'}) is not authorized to access this route`,
    });
  }

  return next();
};
