// middleware/upload.js - ENHANCED VERSION
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../utils/response');

// ============================================
// ENSURE UPLOAD DIRECTORIES EXIST
// ============================================
const uploadDirs = ['uploads/profiles', 'uploads/documents'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// STORAGE CONFIGURATION
// ============================================
const getStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = subfolder ? `uploads/${subfolder}` : 'uploads/profiles';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const prefix = subfolder === 'documents' ? 'doc' : 'profile';
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
  });
};

// ============================================
// FILE FILTERS
// ============================================
// For profile photos (images only)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'));
  }
};

// For documents (images + PDF + Word)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDF, Word, and text files are allowed!'));
  }
};

// ============================================
// MULTER INSTANCES
// ============================================
// For profile photos (single image)
const uploadImage = multer({
  storage: getStorage('profiles'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFilter
});

// For documents (multiple files)
const uploadDocument = multer({
  storage: getStorage('documents'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: documentFilter
});

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

// Single file upload (for profile photo)
const handleUpload = (req, res, next) => {
  uploadImage.single('profileImage')(req, res, (err) => {
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

// Multiple files upload (for documents)
const handleMultipleUpload = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    uploadDocument.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
          return sendError(res, 400, 'File too large. Maximum size is 10MB.');
        }
        return sendError(res, 400, `Upload error: ${err.message}`);
      } else if (err) {
        return sendError(res, 400, err.message);
      }
      next();
    });
  };
};

// Mixed upload: profile photo + documents
const handleMixedUpload = (req, res, next) => {
  // Use multer fields to handle both
  const mixedUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const folder = file.fieldname === 'profilePhoto' ? 'profiles' : 'documents';
        const uploadPath = `uploads/${folder}`;
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const prefix = file.fieldname === 'profilePhoto' ? 'profile' : 'doc';
        cb(null, `${prefix}-${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'profilePhoto') {
        // Only images for profile
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Profile photo must be an image'));
        }
      } else {
        // Documents: images, PDF, Word
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Invalid document format. Allowed: JPG, PNG, PDF, DOC, DOCX'));
        }
      }
    }
  }).fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]);

  mixedUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return sendError(res, 400, 'File too large. Maximum size is 10MB.');
      }
      return sendError(res, 400, `Upload error: ${err.message}`);
    } else if (err) {
      return sendError(res, 400, err.message);
    }
    next();
  });
};

// ============================================
// DELETE FUNCTIONS
// ============================================

// Delete single file
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error('Delete file error:', error);
  }
  return false;
};

// Delete multiple files
const deleteFiles = (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) return false;
  let successCount = 0;
  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) successCount++;
  });
  return successCount;
};

// Delete profile image (alias for backward compatibility)
const deleteProfileImage = deleteFile;

// Cleanup temporary uploads
const cleanupUploads = (req) => {
  if (req.file) {
    deleteFile(req.file.path);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(file => deleteFile(file.path));
    } else {
      // For mixed upload, req.files is an object
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => deleteFile(file.path));
        }
      });
    }
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  upload: uploadImage,
  uploadDocument,
  handleUpload,
  handleMultipleUpload,
  handleMixedUpload,
  deleteFile,
  deleteFiles,
  deleteProfileImage,
  cleanupUploads
};