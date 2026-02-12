const express = require('express');
const {
    addRoom,
    getRooms,
    updateRoom,
    deleteRoom,
} = require('../controllers/room.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const upload = require('../middleware/upload.middleware');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getRooms)
    .post(protect, authorize('owner'), upload.array('images', 5), addRoom);

router.route('/:roomId')
    .put(protect, authorize('owner'), upload.array('images', 5), updateRoom)
    .delete(protect, authorize('owner'), deleteRoom);

module.exports = router;
