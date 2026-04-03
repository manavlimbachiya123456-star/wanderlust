const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ONLY ONE declaration
let passportLocalMongoose = require("passport-local-mongoose");

// fix for object issue
passportLocalMongoose = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);