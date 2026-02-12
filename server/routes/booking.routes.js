const express = require('express');
const {
    checkRoomAvailability,
    createBooking,
    getBookingById,
    getUserBookings,
    cancelBooking
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/check-availability', protect, checkRoomAvailability);
router.post('/create', protect, createBooking);

router.get('/:id', protect, getBookingById);
router.get('/user/:userId', protect, getUserBookings);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
