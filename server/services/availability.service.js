const Booking = require('../models/Booking');
const Room = require('../models/Room');

const checkAvailability = async (roomId, checkIn, checkOut) => {
    const room = await Room.findById(roomId);

    if (!room) {
        throw new Error('Room not found');
    }

    // Count overlapping bookings
    const overlappingBookings = await Booking.countDocuments({
        roomId,
        status: { $in: ['PENDING', 'CONFIRMED'] },
        $or: [
            {
                checkIn: { $lte: new Date(checkIn) },
                checkOut: { $gt: new Date(checkIn) }
            },
            {
                checkIn: { $lt: new Date(checkOut) },
                checkOut: { $gte: new Date(checkOut) }
            },
            {
                checkIn: { $gte: new Date(checkIn) },
                checkOut: { $lte: new Date(checkOut) }
            }
        ]
    });

    // Return true if requests < total rooms
    return {
        available: overlappingBookings < room.totalRooms,
        totalRooms: room.totalRooms,
        bookedRooms: overlappingBookings,
        availableRooms: room.totalRooms - overlappingBookings
    };
};

module.exports = {
    checkAvailability
};
