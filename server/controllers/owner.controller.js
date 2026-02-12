const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// @desc    Get owner dashboard stats
// @route   GET /api/owner/stats
// @access  Private (Owner)
const getOwnerStats = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // 1. Get all hotels owned by this user
        const hotels = await Hotel.find({ ownerId });
        const hotelIds = hotels.map(h => h._id);

        if (hotelIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalHotels: 0,
                    totalBookings: 0,
                    totalRevenue: 0,
                    occupancyRate: '0%',
                    recentBookings: []
                }
            });
        }

        // 2. Get booking stats
        const totalBookings = await Booking.countDocuments({ hotelId: { $in: hotelIds } });

        const revenueData = await Booking.aggregate([
            {
                $match: {
                    hotelId: { $in: hotelIds },
                    status: { $in: ['CONFIRMED', 'COMPLETED'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);

        const totalRevenue = revenueData[0] ? revenueData[0].total : 0;

        // 3. Calculate occupancy (simplified for now: confirmed bookings vs total room capacity for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeBookings = await Booking.countDocuments({
            hotelId: { $in: hotelIds },
            status: { $in: ['CONFIRMED', 'COMPLETED'] },
            checkIn: { $lte: today },
            checkOut: { $gte: today }
        });

        const rooms = await Room.find({ hotelId: { $in: hotelIds } });
        const totalCapacity = rooms.reduce((acc, r) => acc + r.totalRooms, 0);

        const occupancyRate = totalCapacity > 0
            ? Math.round((activeBookings / totalCapacity) * 100)
            : 0;

        // 4. Recent bookings
        const recentBookings = await Booking.find({ hotelId: { $in: hotelIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email')
            .populate('roomId', 'type');

        res.json({
            success: true,
            data: {
                totalHotels: hotelIds.length,
                totalBookings,
                totalRevenue,
                occupancyRate: occupancyRate + '%',
                recentBookings
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOwnerStats
};
