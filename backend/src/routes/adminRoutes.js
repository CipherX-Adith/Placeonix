const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getCompanies,
  verifyCompany,
  getUsers,
  toggleUserStatus,
  createDrive,
  getDrives,
  getPlacementReport,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/companies', getCompanies);
router.put('/companies/:id/verify', verifyCompany);
router.get('/users', getUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.post('/drives', createDrive);
router.get('/drives', getDrives);
router.get('/reports/placement', getPlacementReport);

module.exports = router;
