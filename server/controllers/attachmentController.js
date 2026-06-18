const upload = require('../middleware/upload');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Single file upload endpoint
exports.uploadFile = [
  upload.single('file'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded or invalid file format.', 400);
    }
    
    // In a real app we'd save to DB. For this context, returning the URL is enough
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(201).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  })
];
