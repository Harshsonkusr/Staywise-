const Hotel = require('../models/Hotel');

// @desc    Create a new hotel
// @route   POST /api/owner/hotels
// @access  Private (Owner)
// @desc    Create a new hotel
// @route   POST /api/owner/hotels
// @access  Private (Owner)
const createHotel = async (req, res) => {
    try {
        const hotelData = { ...req.body };
        hotelData.ownerId = req.user._id;

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            hotelData.images = req.files.map(file => ({
                url: file.path,
                publicId: file.filename // Cloudinary public_id
            }));
        }

        const hotel = await Hotel.create(hotelData);

        res.status(201).json({
            success: true,
            data: hotel,
            message: 'Hotel created successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Room = require('../models/Room');

// @desc    Get all hotels (with advanced filters)
// @route   GET /api/search
// @access  Public
const getHotels = async (req, res) => {
    try {
        const { city, rating, amenities, price, guests } = req.query;
        let query = { approved: true };

        // 1. Basic Filters
        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        if (amenities) {
            const amenitiesList = amenities.split(',');
            query.amenities = { $all: amenitiesList };
        }

        // 2. Room-level Filters (Price & Guests)
        let hotelIdsFromRooms = null;
        if (price || guests) {
            let roomQuery = {};

            if (price) {
                roomQuery.basePrice = {};
                if (price.min) roomQuery.basePrice.$gte = Number(price.min);
                if (price.max) roomQuery.basePrice.$lte = Number(price.max);
            }

            if (guests) {
                roomQuery.maxGuests = { $gte: Number(guests) };
            }

            const rooms = await Room.find(roomQuery).select('hotelId');
            hotelIdsFromRooms = [...new Set(rooms.map(r => r.hotelId.toString()))];

            // If no rooms match, result will be empty
            if (hotelIdsFromRooms.length === 0) {
                return res.json({ success: true, count: 0, data: [] });
            }

            query._id = { $in: hotelIdsFromRooms };
        }

        const hotels = await Hotel.find(query).populate({
            path: 'rooms',
            match: price || guests ? {
                ...(price?.min ? { basePrice: { $gte: Number(price.min) } } : {}),
                ...(price?.max ? { basePrice: { ...((price?.min) ? { $gte: Number(price.min) } : {}), $lte: Number(price.max) } } : {}),
                ...(guests ? { maxGuests: { $gte: Number(guests) } } : {})
            } : {}
        });

        // Filter out hotels that might have had rooms but after inner 'match' populating they have none (edge case)
        const filteredHotels = hotels.filter(h => h.rooms.length > 0 || !(price || guests));

        res.json({
            success: true,
            count: filteredHotels.length,
            data: filteredHotels,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate('rooms');

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        res.json({
            success: true,
            data: hotel,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get owner hotels
// @route   GET /api/owner/hotels
// @access  Private (Owner)
const getOwnerHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ ownerId: req.user._id });

        res.json({
            success: true,
            count: hotels.length,
            data: hotels,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update hotel
// @route   PUT /api/owner/hotels/:id
// @access  Private (Owner)
const updateHotel = async (req, res) => {
    try {
        let hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Make sure user is hotel owner
        if (hotel.ownerId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not authorized to update this hotel' });
        }

        const updateData = { ...req.body };

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));

            // Append or replace? Usually append or handle separately. 
            // For now, let's append to existing images if requested, or replace if images field is provided.
            // Simplified: replace if files are uploaded.
            updateData.images = newImages;
        }

        hotel = await Hotel.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            data: hotel,
            message: 'Hotel updated successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete hotel
// @route   DELETE /api/owner/hotels/:id
// @access  Private (Owner)
const deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        if (hotel.ownerId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not authorized to delete this hotel' });
        }

        await hotel.remove();

        res.json({
            success: true,
            message: 'Hotel removed',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createHotel,
    getHotels,
    getHotelById,
    getOwnerHotels,
    updateHotel,
    deleteHotel,
};
