const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD']
    },

    paymentGateway: {
        type: String,
        enum: ['razorpay', 'stripe'],
        required: true
    },

    orderId: {
        type: String,
        required: true
    },

    paymentId: {
        type: String,
        sparse: true
    },

    signature: {
        type: String,
        sparse: true
    },

    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

    refundId: String,

    refundAmount: Number,

    refundedAt: Date,

    failureReason: String,

    metadata: {
        type: Map,
        of: String
    },

}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
