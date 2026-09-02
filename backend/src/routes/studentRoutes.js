const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadResume,
  getAvailableJobs,
  applyForJob,
  getMyApplications,
  withdrawApplication,
  getDashboardSummary,
  parseResumeAndAutoFill,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All student routes are protected and restricted to 'student' role
router.use(protect);
router.use(authorize('student'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', upload.single('resume'), uploadResume);
router.post('/resume/parse', upload.single('resume'), parseResumeAndAutoFill);
router.post('/parse-resume', upload.single('resume'), parseResumeAndAutoFill);
router.post('/resume/ai-autofill', upload.single('resume'), parseResumeAndAutoFill);
router.get('/jobs', getAvailableJobs);
router.post('/apply/:jobId', applyForJob);
router.post('/jobs/:jobId/apply', applyForJob);
router.get('/applications', getMyApplications);
router.delete('/applications/:id', withdrawApplication);
router.put('/applications/:id/withdraw', withdrawApplication);
router.post('/applications/:id/withdraw', withdrawApplication);
router.get('/dashboard-summary', getDashboardSummary);

module.exports = router;
