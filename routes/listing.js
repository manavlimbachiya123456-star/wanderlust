const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage })

// ================= ALL LISTINGS =================
router.get("/", async (req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index", { alllistings });
});

// ================= create NEW LISTING FORM =================
router.get("/new", (req, res) => {

  if(!req.isAuthenticated()){
    req.flash("error","you must be logged in to create listing")
    return res.redirect("/login");
  }
  res.render("listings/new");
});

// ================= SHOW LISTING =================
router.get("/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
      path:"reviews",
      populate:{
        path:"author",
      }, 
    })
    .populate("owner");

    if(!req.isAuthenticated()){
      req.flash("error","you must be logged in to create listing")
      return res.redirect("/login");
    }

    if (!listing) {
      throw new ExpressError(404, "Listing not found!");
    }

    res.render("listings/show", { listing });

  } catch (err) {
    next(err);
  }

 
});

// ================= CREATE LISTING =================
router.post("/",upload.single("listing[image]"), async (req, res, next) => {
  try {

    let url = req.file.path;
    let filename = req.file.filename;
     
   
    
     const newlisting = new Listing(req.body.listing);
     newlisting.image = { url, filename };

     newlisting.owner =req.user._id;

     if (!newlisting.title) {
      throw new ExpressError(400, "Title is missing!");
    }
    if (!newlisting.description) {
      throw new ExpressError(400, "Description is missing!");
    }
    if (!newlisting.location) {
      throw new ExpressError(400, "Location is missing!");
    }

    await newlisting.save();
    req.flash("success","New Listing is created");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
});

// ================= EDIT FORM =================
router.get("/:id/edit", async (req, res) => {

  if(!req.isAuthenticated()){
    req.flash("error","you must be logged in to create listing")
    return res.redirect("/login");
  }
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit", { listing });
});

// ================= UPDATE =================
router.put("/:id",upload.single("listing[image]"), async (req, res, next) => {
  try {
     let { id } = req.params;
     let listing =   await Listing.findByIdAndUpdate(id, { ...req.body.listing });

     if(req.file){

      let url = req.file.path;
      let filename = req.file.filename;
      listing.image ={ url, filename };
      await listing.save();
     }

    req.flash("success"," Listing is updated");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res, next) => {
  try {

    
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
      req.flash("success"," Listing is deleted");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
});

module.exports = router;