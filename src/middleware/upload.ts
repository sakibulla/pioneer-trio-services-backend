import multer from 'multer';
import sharp from 'sharp';
import { BadRequestError } from '../utils/appError';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from '../config/constants';

const memoryStorage = multer.memoryStorage();

// File filter inspecting MIME types
const documentFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Unsupported document type (${file.mimetype}). Allowed types: PDF, JPEG, PNG.`));
  }
};

const photoFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.PHOTOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Unsupported photo type (${file.mimetype}). Allowed types: JPEG, PNG, WebP.`));
  }
};

export const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZES.DOCUMENT },
  fileFilter: documentFileFilter,
});

export const uploadPhoto = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZES.PHOTO },
  fileFilter: photoFileFilter,
});

/**
 * Verify Magic Bytes of common file formats to prevent malicious MIME spoofing
 */
export const verifyMagicBytes = (buffer: Buffer, mimetype: string): boolean => {
  if (!buffer || buffer.length < 4) return false;

  const hex = buffer.toString('hex', 0, 4);

  if (mimetype === 'application/pdf') {
    return buffer.toString('utf-8', 0, 4) === '%PDF';
  }
  if (mimetype === 'image/jpeg') {
    return hex.startsWith('ffd8ff');
  }
  if (mimetype === 'image/png') {
    return hex === '89504e47';
  }
  if (mimetype === 'image/webp') {
    return buffer.toString('utf-8', 8, 12) === 'WEBP';
  }

  return true;
};

/**
 * Optimize image: resize to max 1200x1600, compress to WebP format (~200KB)
 */
export const processProfilePhoto = async (
  inputBuffer: Buffer
): Promise<{ optimizedBuffer: Buffer; thumbnailBuffer: Buffer; width: number; height: number }> => {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  // 1. High-Quality WebP Profile Photo (Max 1200x1600)
  const optimizedBuffer = await sharp(inputBuffer)
    .resize({
      width: 1200,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  // 2. Fast-Loading Thumbnail (Max 300x400)
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize({
      width: 300,
      height: 400,
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    optimizedBuffer,
    thumbnailBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
};
