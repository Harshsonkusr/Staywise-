const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Helper to get Razorpay instance
const getRazorpay = () => {
    if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET
        });
    }
    return null;
};

// @desc    Create payment order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check ownership
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (booking.status !== 'PENDING') {
            return res.status(400).json({ message: 'Booking is not pending' });
        }

        const razorpay = getRazorpay();
        let orderId;
        let currency = 'INR';
        // Amount in paise
        let amount = booking.totalPrice * 100;

        if (razorpay) {
            // Create real order
            const options = {
                amount,
                currency,
                receipt: bookingId
            };
            const order = await razorpay.orders.create(options);
            orderId = order.id;
        } else {
            // Mock order ID for dev without keys
            orderId = `order_${Date.now()}_mock`;
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ message: 'Payment gateway not configured' });
            }
        }

        // Save payment record
        await Payment.create({
            bookingId,
            userId: req.user._id,
            amount: booking.totalPrice,
            currency,
            paymentGateway: 'razorpay',
            orderId,
            status: 'PENDING'
        });

        res.json({
            success: true,
            data: {
                orderId,
                amount,
                currency,
                bookingId,
                key: process.env.RAZORPAY_KEY // To send to frontend
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        let isAuthentic = false;

        if (process.env.RAZORPAY_SECRET) {
            const generated_signature = crypto
                .createHmac('sha256', process.env.RAZORPAY_SECRET)
                .update(orderId + '|' + paymentId)
                .digest('hex');

            if (generated_signature === signature) {
                isAuthentic = true;
            }
        } else {
            // Mock verification
            isAuthentic = true;
        }

        if (isAuthentic) {
            payment.status = 'SUCCESS';
            payment.paymentId = paymentId;
            payment.signature = signature;
            await payment.save();

            // Update booking
            await Booking.findByIdAndUpdate(payment.bookingId, {
                status: 'CONFIRMED',
                paymentStatus: 'SUCCESS',
                paymentId
            });

            res.json({
                success: true,
                data: {
                    verified: true
                },
                message: 'Payment verified and booking confirmed'
            });
        } else {
            payment.status = 'FAILED';
            await payment.save();

            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
