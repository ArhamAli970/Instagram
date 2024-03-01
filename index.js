const express= require("express");
const app= express();
const path =require("path");
const methodOverride=require("method-override");
const ejsMate= require("ejs-mate");
const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
const User=require("./models/owner.js");
const Account=require("./models/acc.js");
const Post=require("./models/post.js");
const session =require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const post = require("./models/post.js");
const asyncWrap=require("./middleware/wrapAsync.js")
const { access } = require("fs");

app.use(express.json({ limit: '10mb' }));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));
app.engine('ejs', ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/insta');
}



app.use(session({ 
    secret: "myinstagramonly",
    resave: false,
    saveUninitialized: true,   
    cookie:{ 
    expires:Date.now()+ 7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true  // use for prevent from cross scripting attack
    }
}))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    // console.log(req.flash("error"));
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    
    res.locals.user=req.user;
    next();
    
})

app.use("/login",(req,res,next)=>{
    if(req.user){

    }else{
        
    }
})




app.get("/search",asyncWrap( async(req,res)=>{
    let {search}=req.query;
    let d=await User.findOne({username:search});
    let posts=await Post.find({author:d._id});
    let data=await Account.findOne({username:d._id}).populate('username');
    console.log(posts);
    console.log(data);
    // console.log(data._id);
    res.render("list/account.ejs",{data,posts});

}));



app.get("/insta",asyncWrap(async(req,res)=>{
    let posts=await Post.find({}).populate('author');
    // console.log(posts);
    res.render('list/insta.ejs',{posts});

}))

app.get("/instagram",asyncWrap( async(req,res)=>{
    let{id}=req.params;
    // console.log(id);
    // let post=await Post.findById(id);
    let data=await Account.findOne({username:req.user._id}).populate('username');
    

    let posts=await Post.find({author:req.user._id});

    console.log(data);
    // console.log(data.pic);
    res.render("list/account.ejs",{data,posts});
    // res.send("hello");
}))

app.get("/createPost/:id",(req,res)=>{
    let {id}=req.params;
    res.render("list/create.ejs",{id});
})

app.get("/editProf/:id",asyncWrap(async(req,res)=>{
let{id}=req.params;
let data=await Account.findOne({_id:id});
res.render('list/editProfile.ejs',{data});
}))

app.put("/editProf/:id",asyncWrap( async(req,res)=>{
    let{id}=req.params;

    let {pic,bio}=req.body;

    // let data=await Account.findById("65dda0270f0310ea30f946d5");
    // console.log(data);
    // res.send("Dfd");
    let data=await Account.findByIdAndUpdate(id,{$set:{pic:pic,bio:bio}},{runValidators:true,new:true});
    // console.log(data);
    res.redirect(`/instagram`)
}))


app.post("/like/:id",asyncWrap( async(req,res)=>{
    let {id}=req.params;
    let data=await Post.findOne({_id:id});
    // console.log(data,req.user);
    let likesArray=data.like;

    if(!likesArray.includes(req.user.username)){
 await Post.findByIdAndUpdate(id,{like:[...likesArray,req.user.username]});
    }
    else{
        likesArray=likesArray.filter((ele)=>{
            return ele!=req.user.username;
        })
        await Post.findByIdAndUpdate(id,{like:[...likesArray]});
    }

    // await Post.findByIdAndUpdate(id,{like:[...likesArray,req.user.username]});
    res.redirect('/insta');
})
)



app.post("/createPost/:id",asyncWrap((req,res)=>{
    // let{id}=req.params;
    let {url,caption}=req.body;
    let newPost= new Post({
      author:req.user._id,
      url:url,
      like:[],
      caption:caption 
    })
    newPost.save();
    res.redirect('/insta')
}))


app.get("/signup",(req,res)=>{
    res.render("list/sign.ejs");
})
app.post("/sign",asyncWrap(async(req,res)=>{
   let {mail,username,password}=req.body;
//   console.log(pic);
    const newUser= new User({mail,username});
    await User.register(newUser,password);  
    let user=await User.findOne({username:username});
    let acc= new Account({
        username:user._id,
        bio:"",
        pic:"https://www.tenforums.com/geek/gars/images/2/types/thumb_15951118880user.png",
        followers:[],
        following:[]
    })

    await acc.save();

    req.flash("success","u have sign in")
    res.redirect("/login")
}))

app.post('/saveImg',asyncWrap(async(req,res,next)=>{

    let url=req.body.url;
    let h5=req.body.h5;
    await Account.findOneAndUpdate({username:h5},{pic:url});
    res.redirect('/insta');


}))




app.get("/login",(req,res)=>{
    res.render("list/login.ejs");
})

app.post("/login",passport.authenticate('local',{failureRedirect:'/login',failureFlash:true}),(req,res)=>{
    try{
    req.flash("success","sing up done");
    res.redirect("/insta");
    }catch(e){
        req.flash("error",e.message);
    }
})


app.post("/logout",asyncWrap(async(req,res,next)=>{ 
    req.logout((err)=>{ 
        if(err){ 
            next(err)
     }else{ 
            req.flash("success","You Logged Out");
            res.redirect('/login');
        }
    });      
    
  
}))


app.use((err,req,res,next)=>{
    res.send("error occurs");
})


app.get("*",(req,res)=>{
res.send("Page Not found");
})




app.listen(8080,()=>{
    console.log("insta listen");
})