const {
    parseSearchIntent,
    suggestPrice,
    getRecommendations
} = require('../services/ai.service');

// @desc    Get search intent analysis
// @route   POST /api/ai/search-intent
// @access  Public
const getSearchIntent = async (req, res) => {
    try {
        const { query } = req.body;
        const intent = parseSearchIntent(query);
        res.json({ success: true, data: intent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get price suggestion
// @route   GET /api/ai/price-suggestion/:hotelId
// @access  Private (Owner)
const getPriceSuggestion = async (req, res) => {
    try {
        // Check ownership logic should ideally be here or in middleware
        const suggestion = await suggestPrice(req.params.hotelId);
        res.json({ success: true, data: suggestion });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get personalized recommendations
// @route   GET /api/ai/recommendations
// @access  Private (User)
const getUserRecommendations = async (req, res) => {
    try {
        const recommendations = await getRecommendations(req.user._id);
        res.json({ success: true, count: recommendations.length, data: recommendations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSearchIntent,
    getPriceSuggestion,
    getUserRecommendations
};
