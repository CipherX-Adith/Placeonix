const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  createJob,
  getMyJobs,
  getJobApplicants,
  updateApplicationStatus,
  toggleJobStatus,
  getDashboardSummary,
  getCandidates,
} = require('../controllers/recruiterController');
const { protect, authorize } = require('../middleware/auth');

// All recruiter routes are protected and restricted to 'recruiter' role
router.use(protect);
router.use(authorize('recruiter'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.get('/jobs/:jobId/applicants', getJobApplicants);
router.put('/jobs/:jobId/status', toggleJobStatus);
router.put('/applications/:applicationId/status', updateApplicationStatus);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/candidates', getCandidates);

module.exports = router;
