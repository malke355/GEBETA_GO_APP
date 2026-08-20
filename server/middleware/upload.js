import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname || '.jpg')}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
  return cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

export const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (!err) {
      return next();
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'Image must be 5MB or smaller'));
    }
    return next(new ApiError(400, 'Only JPEG, PNG, WebP and GIF images are allowed'));
  });
};

export const resolveUploadedImageUrl = (req) => {
  if (!req.file) {
    return '';
  }
  return `/uploads/${req.file.filename}`;
};
