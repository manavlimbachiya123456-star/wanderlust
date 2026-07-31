const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("../utils/razorpay.js");
const Booking = require("../models/booking.js");

// STEP 1: Create a Razorpay order (called after booking is created but before payment)
router.post("/bookings/:id/create-order", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const options = {
      amount: booking.totalPrice * 100, // Razorpay works in paise, not rupees
      currency: "INR",
      receipt: `booking_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to open checkout
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create payment order" });
  }
});

// STEP 2: Verify payment after Razorpay checkout completes
router.post("/bookings/:id/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("Received from frontend:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("Generated signature:", generatedSignature);
    console.log("Match?", generatedSignature === razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Payment verification failed" });
    }

    const booking = await Booking.findById(req.params.id);
    booking.paymentStatus = "paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ success: false, error: "Verification error" });
  }
});

module.exports = router;