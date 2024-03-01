const mongoose= require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

let ownerSchema=new mongoose.Schema({ 
    mail:{ 
        type:String,
        required:true
    }

})

ownerSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",ownerSchema);