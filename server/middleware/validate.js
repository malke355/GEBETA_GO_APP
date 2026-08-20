import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: errors.array()[0].msg,
    errors: errors.array().map((error) => ({ field: error.path, message: error.msg })),
  });
};

export default validate;
