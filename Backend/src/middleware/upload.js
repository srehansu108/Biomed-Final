const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../utils/response');

// Ensure upload directory exists
const uploadDir = 'uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Single file upload
const handleUpload = (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return sendError(res, 400, 'File too large. Maximum size is 5MB.');
      }
      return sendError(res, 400, `Upload error: ${err.message}`);
    } else if (err) {
      return sendError(res, 400, err.message);
    }
    next();
  });
};

// Multiple files upload
const handleMultipleUpload = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
          return sendError(res, 400, 'File too large. Maximum size is 5MB.');
        }
        return sendError(res, 400, `Upload error: ${err.message}`);
      } else if (err) {
        return sendError(res, 400, err.message);
      }
      next();
    });
  };
};

// Delete profile image
const deleteProfileImage = (imagePath) => {
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return true;
    }
  } catch (error) {
    console.error('Delete profile image error:', error);
  }
  return false;
};

module.exports = { upload, handleUpload, handleMultipleUpload, deleteProfileImage };