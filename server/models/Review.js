const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },

    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },

    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    comment: {
        type: String,
        required: [true, 'Comment is required'],
        minlength: [10, 'Comment must be at least 10 characters'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },

    images: [{
        url: String
    }],

    ownerResponse: {
        comment: String,
        respondedAt: Date
    },

    helpful: {
        type: Number,
        default: 0
    },

    verified: {
        type: Boolean,
        default: false // Verified if user actually stayed
    },

}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ hotelId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true }); // One review per booking

// Update hotel rating after review
reviewSchema.post('save', async function () {
    const Hotel = mongoose.model('Hotel');

    const stats = await this.constructor.aggregate([
        { $match: { hotelId: this.hotelId } },
        {
            $group: {
                _id: '$hotelId',
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Hotel.findByIdAndUpdate(this.hotelId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
