import multer from 'multer';

// Use memory storage so files are kept in buffer for direct upload to Cloudinary
export const upload = multer({ storage: multer.memoryStorage() });
