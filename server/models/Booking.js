const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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

    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },

    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required']
    },

    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required'],
        validate: {
            validator: function (value) {
                return value > this.checkIn;
            },
            message: 'Check-out must be after check-in'
        }
    },

    guests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'Must have at least 1 guest']
    },

    nights: {
        type: Number,
        required: true
    },

    roomPrice: {
        type: Number,
        required: true
    },

    totalPrice: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: {
            values: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED'],
            message: '{VALUE} is not a valid status'
        },
        default: 'PENDING'
    },

    paymentId: {
        type: String,
        sparse: true
    },

    paymentStatus: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

    cancellationReason: String,

    cancelledAt: Date,

    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Denormalized data
    hotelName: String,
    roomType: String,

    expiresAt: {
        type: Date,
        index: { expires: '15m' } // TTL for pending bookings
    },

}, {
    timestamps: true
});

// Indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// Calculate nights before saving
bookingSchema.pre('save', function (next) {
    if (this.isModified('checkIn') || this.isModified('checkOut')) {
        const diffTime = Math.abs(this.checkOut - this.checkIn);
        this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
