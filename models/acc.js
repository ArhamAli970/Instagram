const mongoose =require("mongoose");

const schema= new mongoose.Schema({
    username:{
        type:mongoose.Types.ObjectId,
       ref:'User', 
    },
    bio:String,
    pic:{
        type:String,
    },
    followers:[{
        type:String  
    }],
    following:[{
        type:String
    }]
})

module.exports=mongoose.model("Account",schema);
