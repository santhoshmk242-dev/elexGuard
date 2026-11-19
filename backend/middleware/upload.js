'use strict';
const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_BYTES = 1024 * 1024; // 1 MB candidate photograph
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 20 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) return cb(new AppError('Only JPEG, PNG or WebP images are allowed.', 400, 'INVALID_FILE_TYPE'));
    return cb(null, true);
  },
});

// Verify the real file signature (magic bytes) – the client-supplied MIME type cannot be trusted.
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

/** Middleware: accepts an optional single "photo" file and attaches the validated file to req.photo. */
function candidatePhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Photograph must be 1 MB or smaller.', 413, 'FILE_TOO_LARGE'));
      return next(err instanceof AppError ? err : new AppError('Invalid upload.', 400, 'UPLOAD_ERROR'));
    }
    if (req.file) {
      const real = detectImageType(req.file.buffer);
      if (!real) return next(new AppError('The uploaded file is not a valid JPEG, PNG or WebP image.', 400, 'INVALID_FILE_CONTENT'));
      req.photo = { data: req.file.buffer, contentType: real };
    }
    return next();
  });
}

module.exports = { candidatePhoto, detectImageType };
