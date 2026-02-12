const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: [true, 'Hotel name is required'],
        trim: true,
        minlength: [3, 'Hotel name must be at least 3 characters'],
        maxlength: [100, 'Hotel name cannot exceed 100 characters']
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [20, 'Description must be at least 20 characters'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },

    address: {
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },

    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },

    amenities: [{
        type: String
    }],

    images: [{
        url: String,
        caption: String
    }],

    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },

    totalReviews: {
        type: Number,
        default: 0
    },

    approved: {
        type: Boolean,
        default: false
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvedAt: Date,

    featured: {
        type: Boolean,
        default: false
    },

    featuredUntil: Date,

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },

    rejectionReason: String,

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
hotelSchema.index({ city: 1, approved: 1 });
hotelSchema.index({ ownerId: 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ location: '2dsphere' });

// Virtual for rooms
hotelSchema.virtual('rooms', {
    ref: 'Room',
    localField: '_id',
    foreignField: 'hotelId'
});

module.exports = mongoose.model('Hotel', hotelSchema);
