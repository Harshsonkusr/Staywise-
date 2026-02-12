const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { bookingId, rating, title, comment, images } = req.body;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check ownership
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this booking' });
        }

        // Check if completed/confirmed
        if (booking.status !== 'COMPLETED' && booking.status !== 'CONFIRMED') {
            return res.status(400).json({ message: 'Can only review completed or confirmed bookings' });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }

        const review = await Review.create({
            userId: req.user._id,
            hotelId: booking.hotelId,
            bookingId,
            rating,
            title,
            comment,
            images,
            verified: true // Since we checked booking
        });

        res.status(201).json({
            success: true,
            data: review,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hotel reviews
// @route   GET /api/hotels/:hotelId/reviews
// @access  Public
const getHotelReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ hotelId: req.params.hotelId })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getHotelReviews
};
