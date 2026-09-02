const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const resumeDir = path.join(uploadDir, 'resumes');
const logoDir = path.join(uploadDir, 'logos');

[uploadDir, resumeDir, logoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'resume') {
      cb(null, resumeDir);
    } else if (file.fieldname === 'logo') {
      cb(null, logoDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for resumes (PDF, DOC, DOCX) and logos (Images)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    const allowedExtensions = /pdf|doc|docx|txt/;
    const extname = allowedExtensions.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'text/plain' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname && (mimetype || extname)) {
      return cb(null, true);
    }
    return cb(
      new Error('Invalid resume format! Only PDF, DOC, DOCX, and TXT files are allowed.')
    );
  } else if (file.fieldname === 'logo') {
    const allowedTypes = /jpeg|jpg|png|webp|svg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    return cb(
      new Error('Invalid image format! Only JPG, PNG, WEBP, and SVG are allowed.')
    );
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter,
});

module.exports = upload;
