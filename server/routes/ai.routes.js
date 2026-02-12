const express = require('express');
const {
    getSearchIntent,
    getPriceSuggestion,
    getUserRecommendations
} = require('../controllers/ai.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/search-intent', getSearchIntent);
router.get('/recommendations', protect, getUserRecommendations);
router.get('/price-suggestion/:hotelId', protect, authorize('owner'), getPriceSuggestion);

module.exports = router;
