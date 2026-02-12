const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Add room to hotel
// @route   POST /api/owner/hotels/:hotelId/rooms
// @access  Private (Owner)
// @desc    Add room to hotel
// @route   POST /api/owner/hotels/:hotelId/rooms
// @access  Private (Owner)
const addRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelId);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Check ownership
        if (hotel.ownerId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not authorized to add rooms to this hotel' });
        }

        const roomData = { ...req.body, hotelId: req.params.hotelId };

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            roomData.images = req.files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));
        }

        const room = await Room.create(roomData);

        res.status(201).json({
            success: true,
            data: room,
            message: 'Room added successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get rooms for a hotel
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ hotelId: req.params.hotelId });

        res.json({
            success: true,
            count: rooms.length,
            data: rooms,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update room
// @route   PUT /api/owner/rooms/:roomId
// @access  Private (Owner)
const updateRoom = async (req, res) => {
    try {
        let room = await Room.findById(req.params.roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const hotel = await Hotel.findById(room.hotelId);

        if (hotel.ownerId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not authorized to update this room' });
        }

        const updateData = { ...req.body };

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));
        }

        room = await Room.findByIdAndUpdate(req.params.roomId, updateData, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            data: room,
            message: 'Room updated successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete room
// @route   DELETE /api/owner/rooms/:roomId
// @access  Private (Owner)
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const hotel = await Hotel.findById(room.hotelId);

        if (hotel.ownerId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not authorized to delete this room' });
        }

        await room.remove();

        res.json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addRoom,
    getRooms,
    updateRoom,
    deleteRoom,
};
