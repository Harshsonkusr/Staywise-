const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { checkAvailability } = require('../services/availability.service');

// @desc    Check availability
// @route   POST /api/booking/check-availability
// @access  Private (User)
const checkRoomAvailability = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;

        const result = await checkAvailability(roomId, checkIn, checkOut);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new booking
// @route   POST /api/booking/create
// @access  Private (User)
const createBooking = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, guests } = req.body;
        const userId = req.user._id;

        // 1. Check availability again (race condition check)
        const availability = await checkAvailability(roomId, checkIn, checkOut);

        if (!availability.available) {
            return res.status(400).json({ message: 'Room not available for selected dates' });
        }

        const room = await Room.findById(roomId);
        const hotel = await Hotel.findById(room.hotelId);

        // Calculate nights and price
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalPrice = nights * room.basePrice;

        // Create booking
        const booking = await Booking.create({
            userId,
            hotelId: hotel._id,
            roomId,
            checkIn,
            checkOut,
            guests,
            nights,
            roomPrice: room.basePrice,
            totalPrice,
            status: 'PENDING',
            hotelName: hotel.name,
            roomType: room.type,
            // expiresAt will be set automatically by schema default/logic if needed, 
            // but Mongoose TTL needs exact field. Schema has it.
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins from now
        });

        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created. Please complete payment within 15 minutes.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get booking details
// @route   GET /api/booking/:id
// @access  Private (Owner of booking)
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('hotelId', 'name city address images')
            .populate('roomId', 'type images');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check access rights (User who booked OR Hotel Owner)
        // Note: To check hotel owner, we might need to fetch hotel.ownerId separately or populate it.
        // For MVP, user check is crucial.
        const isUser = booking.userId._id.toString() === req.user._id.toString();

        if (!isUser && req.user.role !== 'admin') {
            // Allow if hotel owner
            const hotel = await Hotel.findById(booking.hotelId);
            if (hotel.ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this booking' });
            }
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user bookings
// @route   GET /api/booking/user/:userId
// @access  Private (User)
const getUserBookings = async (req, res) => {
    try {
        // Users can only see their own bookings
        if (req.params.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const bookings = await Booking.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel booking
// @route   PUT /api/booking/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check ownership
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Logic: check cancellation policy (e.g. 24h before)
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const diff = checkIn - now;
        const hours = diff / (1000 * 60 * 60);

        // For MVP, allow generic cancellation, maybe with warnings if close
        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Booking already cancelled' });
        }

        booking.status = 'CANCELLED';
        booking.cancelledBy = req.user._id;
        booking.cancelledAt = Date.now();
        booking.cancellationReason = req.body.reason;

        await booking.save();

        res.json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkRoomAvailability,
    createBooking,
    getBookingById,
    getUserBookings,
    cancelBooking
};
