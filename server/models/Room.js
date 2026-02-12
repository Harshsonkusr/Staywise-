const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },

    type: {
        type: String,
        required: [true, 'Room type is required'],
        enum: ['Single', 'Double', 'Deluxe', 'Suite', 'Family']
    },

    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative']
    },

    maxGuests: {
        type: Number,
        required: [true, 'Max guests is required'],
        min: [1, 'Must accommodate at least 1 guest'],
        max: [10, 'Cannot accommodate more than 10 guests']
    },

    totalRooms: {
        type: Number,
        required: [true, 'Total rooms is required'],
        min: [1, 'Must have at least 1 room'],
        max: [100, 'Cannot have more than 100 rooms of same type']
    },

    size: {
        value: Number,
        unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' }
    },

    amenities: [{
        type: String
    }],

    images: [{
        url: String,
        caption: String
    }],

    bedConfiguration: {
        type: String,
        enum: ['1 Single', '1 Double', '2 Single', '1 King', '1 Queen', '2 Double']
    },

    isActive: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: true
});

// Indexes
roomSchema.index({ hotelId: 1 });
roomSchema.index({ basePrice: 1 });

module.exports = mongoose.model('Room', roomSchema);
