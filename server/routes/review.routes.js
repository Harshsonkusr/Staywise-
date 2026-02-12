const express = require('express');
const {
    createReview,
    getHotelReviews
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getHotelReviews)
    .post(protect, createReview);

module.exports = router;
