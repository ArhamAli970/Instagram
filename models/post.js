const mongoose =require("mongoose");

const schema= new mongoose.Schema({
    author:{
       type:mongoose.Types.ObjectId,
       ref:'User',  
    },
    url:{type:String,required:true},
    like:[{type:String,required:true}],
    caption:String,
  
})

module.exports=mongoose.model("Post",schema);