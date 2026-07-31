const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
});

module.exports = mongoose.model("Booking", bookingSchema);