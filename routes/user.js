const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const passport = require("passport");



router.get("/login",(req,res)=>{

    res.render("users/login.ejs");
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


router.get("/signup",(req,res)=>{


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