
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DB URL:", process.env.ATLASDB_URL);

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");


const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const listingsrouter = require("./routes/listing.js");
const userrouter = require("./routes/user.js");
const bookingrouter = require("./routes/booking.js");


const port = 8080;
const dbUrl = process.env.ATLASDB_URL; //  from .env
const secret = process.env.SECRET;     //  from .env

//  VIEW ENGINE 
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

//  MIDDLEWARE 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// MONGO SESSION STORE 
const store = MongoStore.create({
  mongoUrl: dbUrl,           //  from .env
  crypto: {
    secret: secret,          //  from .env
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("Error in mongo session store:", err);
});

//SESSION OPTIONS 
const sessionOptions = {
  store,
  secret: secret,            //  from .env
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //  fixed: 36 -> 60
    maxAge: 7 * 24 * 60 * 60 * 1000,                //  fixed: 36 -> 60
    httpOnly: true,
  },
};

//  SESSION + FLASH 
app.use(session(sessionOptions)); 
app.use(flash());

//PASSPORT 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// LOCALS 
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.curruser = req.user;
  next();
});

//  DB CONNECTION 
main()
  .then(() => console.log(" successfully connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl); //  from .env
}


mongoose.connection.once("open", () => {
  console.log("Connected to DB:", mongoose.connection.name);
});

//  ROUTES 
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingsrouter);
app.use("/", userrouter);
app.use("/", bookingrouter);

// REVIEW ROUTES 
app.post("/listings/:id/reviews", async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    if (!req.body.review.comment) {
      throw new ExpressError(400, "Comment is missing!");
    }

    newReview.author = req.user._id;
    listing.reviews.push(newReview._id);

    await newReview.save();
    await listing.save();

    req.flash("success", "New review is created");
    res.redirect(`/listings/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

app.delete("/listings/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

//  ERROR HANDLER 
app.use((err, req, res, next) => {
  console.error(err); // you already have this — check your terminal output above this stack trace
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { statusCode, message });
});

//  SERVER 
app.listen(port, () => {
  console.log(` server running on port ${port}`);
});