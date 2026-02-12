const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get pending hotels
// @route   GET /api/admin/hotels
// @access  Private (Admin)
const getPendingHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ status: 'pending' })
            .populate('ownerId', 'name email');

        res.json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve hotel
// @route   PUT /api/admin/hotels/:id/approve
// @access  Private (Admin)
const approveHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        hotel.status = 'approved';
        hotel.approved = true;
        hotel.approvedAt = Date.now();
        hotel.approvedBy = req.user._id;

        await hotel.save();

        res.json({
            success: true,
            data: hotel,
            message: 'Hotel approved successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject hotel
// @route   PUT /api/admin/hotels/:id/reject
// @access  Private (Admin)
const rejectHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        hotel.status = 'rejected';
        hotel.approved = false;
        hotel.rejectionReason = req.body.reason;

        await hotel.save();

        res.json({
            success: true,
            data: hotel,
            message: 'Hotel rejected'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHotels = await Hotel.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Calculate revenue (confirmed bookings)
        const revenue = await Booking.aggregate([
            { $match: { status: 'CONFIRMED' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalHotels,
                totalBookings,
                totalRevenue: revenue[0] ? revenue[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingHotels,
    approveHotel,
    rejectHotel,
    getUsers,
    getAnalytics
};
