const mongoose = require('mongoose');
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

//connection
main().then(()=>{
    console.log("sucessfully connected"); 
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');

}

const initDB = async ()=>{

    await Listing.deleteMany({});
    initdata.data = initdata.data.map((obj) =>({...obj,owner:"69c7540def4196610101bf79"}));
    await Listing.insertMany(initdata.data);
    console.log("data was initialized");
};

initDB();