const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const passport = require("passport");
const Otp = require("../models/otp.js");
const { sendOtp } = require("../utils/mailer.js");


router.get("/login",(req,res)=>{

    res.render("users/login.ejs");
});


// Step 1: request OTP
router.post("/signup/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndDelete({ email });
  await new Otp({ email, otp }).save();
  await sendOtp(email, otp);

  req.flash("success", "OTP sent to your email");
  res.render("users/signup.ejs", { otpSent: true, email });
});

// Step 2: verify OTP then create user
router.post("/signup/verify-otp", async (req, res, next) => {
  try {
    const { username, email, password, otp } = req.body;
    const record = await Otp.findOne({ email, otp });

    if (!record) {
      req.flash("error", "Invalid or expired OTP");
      return res.redirect("/signup");
    }

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    await Otp.deleteOne({ _id: record._id });

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "Welcome!");
res.redirect("/listings");
  }
)


router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post("/signup",async(req,res)=>{

    try {
    let { username, email, password } = req.body;

    const newUser = new User({ email, username });

    const registeruser = await User.register(newUser, password);

    req.login(registeruser,(err)=>{

        if(err){
            return next(err);
        }
            req.flash("success", "Welcome to our website!");
            res.redirect("/listings");
    });

   

} catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
}

}); 





router.get("/logout",(req,res,next)=>{

    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success","you are logout");
        res.redirect("/listings");
    });
});




module.exports = router;