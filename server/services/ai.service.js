const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// Mock natural language processing for search intent
const parseSearchIntent = (query) => {
    if (!query) return null;

    query = query.toLowerCase();

    const intent = {
        location: null,
        priceRange: null,
        duration: null,
        amenities: []
    };

    // Extract location (naive approach)
    const cities = ['mumbai', 'delhi', 'bangalore', 'goa', 'jaipur', 'chennai'];
    for (const city of cities) {
        if (query.includes(city)) {
            intent.location = city;
            break;
        }
    }

    // Extract price intent
    if (query.includes('cheap') || query.includes('budget')) {
        intent.priceRange = 'budget';
    } else if (query.includes('luxury') || query.includes('expensive')) {
        intent.priceRange = 'luxury';
    }

    // Extract duration
    const durationMatch = query.match(/(\d+)\s*(night|day)/);
    if (durationMatch) {
        intent.duration = parseInt(durationMatch[1]);
    }

    // Extract amenities
    if (query.includes('pool')) intent.amenities.push('Pool');
    if (query.includes('wifi')) intent.amenities.push('WiFi');
    if (query.includes('gym')) intent.amenities.push('Gym');

    return intent;
};

// Suggest optimal price using simple rule-based logic
const suggestPrice = async (hotelId) => {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) throw new Error('Hotel not found');

    const rooms = await Room.find({ hotelId });
    if (rooms.length === 0) return null;

    const basePrice = rooms[0].basePrice; // Simplified: take first room

    // Calculate current occupancy (mocked logic or real count)
    // For real: count confirmed bookings for next 7 days vs total availability
    const bookingsCount = await Booking.countDocuments({
        hotelId,
        status: 'CONFIRMED',
        checkIn: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    const totalCapacity = rooms.reduce((acc, r) => acc + r.totalRooms, 0) * 7;
    const occupancyRate = bookingsCount / (totalCapacity || 1);

    let suggestion = basePrice;
    let reason = 'Stable demand';

    if (occupancyRate > 0.8) {
        suggestion = basePrice * 1.15;
        reason = 'High demand detected (occupancy > 80%)';
    } else if (occupancyRate < 0.3) {
        suggestion = basePrice * 0.90;
        reason = 'Low demand detected (occupancy < 30%)';
    }

    return {
        originalPrice: basePrice,
        suggestedPrice: Math.round(suggestion),
        reason,
        occupancyRate: Math.round(occupancyRate * 100) + '%'
    };
};

// Personalized recommendations based on user history
const getRecommendations = async (userId) => {
    // Get user's past bookings
    const bookings = await Booking.find({ userId }).populate('hotelId');

    if (!bookings || bookings.length === 0) {
        // Cold start: return top rated hotels
        return await Hotel.find({ approved: true })
            .sort({ rating: -1 })
            .limit(5);
    }

    // Analyze preferences
    const visitedCities = bookings.map(b => b.hotelId?.city).filter(Boolean);

    // Simple collaborative filtering: find hotels in same cities, excluding visited
    const visitedHotelIds = bookings.map(b => b.hotelId?._id);

    const recommendations = await Hotel.find({
        city: { $in: visitedCities },
        _id: { $nin: visitedHotelIds },
        approved: true
    })
        .sort({ rating: -1 })
        .limit(5);

    return recommendations;
};

module.exports = {
    parseSearchIntent,
    suggestPrice,
    getRecommendations
};
