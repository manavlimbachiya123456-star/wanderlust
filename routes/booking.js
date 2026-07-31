const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

// BOOK FORM (on the show page itself, so no separate GET route needed)

// CREATE BOOKING
router.post("/listings/:id/book", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash("error", "You must be logged in to book");
      return res.redirect("/login");
    }

    let { id } = req.params;
    let { checkIn, checkOut, guests } = req.body;

    checkIn = new Date(checkIn);
    checkOut = new Date(checkOut);

    if (checkIn >= checkOut) {
      req.flash("error", "Check-out must be after check-in");
      return res.redirect(`/listings/${id}`);
    }

    const listing = await Listing.findById(id);

    // conflict check
    const existingBookings = await Booking.find({ listing: id });
    const conflict = existingBookings.some(
      (b) => checkIn < b.checkOut && checkOut > b.checkIn
    );

    if (conflict) {
      req.flash("error", "These dates are already booked");
      return res.redirect(`/listings/${id}`);
    }

    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    const totalPrice = nights * listing.price;

    const newBooking = new Booking({
      listing: id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    await newBooking.save();
    req.flash("success", "Booking confirmed!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
});

// MY BOOKINGS
router.get("/my-bookings", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in");
    return res.redirect("/login");
  }
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings/index.ejs", { bookings });
});

// CANCEL BOOKING
router.delete("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Not authorized");
    return res.redirect("/my-bookings");
  }

  await Booking.findByIdAndDelete(id);
  req.flash("success", "Booking cancelled");
  res.redirect("/my-bookings");
});

module.exports = router;