const express = require('express');
const {
    createHotel,
    getHotels,
    getHotelById,
    getOwnerHotels,
    updateHotel,
    deleteHotel,
} = require('../controllers/hotel.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const upload = require('../middleware/upload.middleware');

// Include other resource routers
const roomRouter = require('./room.routes');
const reviewRouter = require('./review.routes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:hotelId/rooms', roomRouter);
router.use('/:hotelId/reviews', reviewRouter);

router.route('/')
    .get(getHotels)
    .post(protect, authorize('owner', 'admin'), upload.array('images', 5), createHotel);

router.route('/owner')
    .get(protect, authorize('owner'), getOwnerHotels);

router.route('/:id')
    .get(getHotelById)
    .put(protect, authorize('owner', 'admin'), upload.array('images', 5), updateHotel)
    .delete(protect, authorize('owner', 'admin'), deleteHotel);

module.exports = router;
