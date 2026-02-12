const express = require('express');
const {
    getPendingHotels,
    approveHotel,
    rejectHotel,
    getUsers,
    getAnalytics
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/hotels', getPendingHotels);
router.put('/hotels/:id/approve', approveHotel);
router.put('/hotels/:id/reject', rejectHotel);

router.get('/users', getUsers);
router.get('/analytics', getAnalytics);

module.exports = router;
