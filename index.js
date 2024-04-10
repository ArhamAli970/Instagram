const express= require("express");
const app= express();
const{createServer}=require('node:http');
const server=createServer(app);
const { Server}=require('socket.io');
const io= new Server(server,{
    connectionStateRecovery:{}
});

const path =require("path");
const methodOverride=require("method-override");
const ejsMate= require("ejs-mate");
const mongoose = require('mongoose');


// const bodyParser = require('body-parser');
const User=require("./models/owner.js");
const Account=require("./models/acc.js");
const Post=require("./models/post.js");
const Chat=require('./models/chat.js');
const session =require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const post = require("./models/post.js");
const asyncWrap=require("./middleware/wrapAsync.js")
// const { access } = require("fs");
// const { profile } = require("console");
const {profileSchema}=require('./schemaProfile.js');
// const { Socket } = require("socket.io");

app.use(express.json({ limit: '10mb' }));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));
app.engine('ejs', ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname, 'public')))

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
    
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    
    res.locals.user=req.user;
    next();
    
})



let isLogged=(req,res,next)=>{
    if(!req.isAuthenticated()){
       return res.redirect('/login');
    }
    next()
}


app.get('/search/:name',asyncWrap(async(req,res)=>{
    let {name}=req.params;
    let ans=[]

    if(name!=''){
    const result = await User.find({ username: { $regex: '^'+ name, $options: 'i' } });

    result.forEach((e)=>{
        ans.push(e.username);
    })

    // console.log(ans);
    }
 
    res.json({ans:ans});
}))




app.get("/search",isLogged,asyncWrap( async(req,res)=>{
    let {name}=req.query;
    // console.log(req.query,search);
    let d=await User.findOne({username:name});
    let posts=await Post.find({author:d._id});
    let data=await Account.findOne({username:req.user._id})
    let dem=await Account.findOne({username:d._id}).populate("username");

   
 
    res.render("list/account.ejs",{data,posts,dem});

}));

app.post("/follow/:id",isLogged,asyncWrap(async(req,res)=>{
    let{id}=req.params;
 
    let folowing=await Account.findOne({_id:id}).populate("username");
    let follower=await Account.findOne({username:req.user._id}).populate("username");


    await Account.findByIdAndUpdate(id,{followers:[...folowing.followers,req.user.username]});

    await Account.findByIdAndUpdate(follower._id,{following:[...follower.following,folowing.username.username]});
    res.redirect('/notification');
}))



app.get("/notification",isLogged,asyncWrap(async(req,res)=>{
    let data=await Account.findOne({username:req.user._id}).populate('username');
    let allAcc=await Account.find({}).populate('username');
    res.render("list/Allusers.ejs",{allAcc,data});
}))


app.post("/follow/remove/:id",asyncWrap(async(req,res)=>{
    let {id}=req.params;
 let mai=await Account.findOne({username:req.user._id}).populate('username');

 let other=await Account.findOne({_id:id}).populate('username');

 let data=other.following;
 data=data.filter((d)=>{
    return d!=req.user.username;
 })




await Account.findByIdAndUpdate(id,{following:data});

let data2=mai.followers;

data2=data2.filter((d)=>{
    return d!=other.username.username;
})


await Account.findOneAndUpdate({username:req.user._id},{followers:data2});



 res.redirect(`/getFollowers/${mai._id}`);

}))





app.post("/unfollow/:id",isLogged,asyncWrap(async(req,res)=>{
    let {id}=req.params;
 let mai=await Account.findOne({username:req.user._id}).populate('username');

 let other=await Account.findOne({_id:id}).populate('username');

 let data=other.followers;
 data=data.filter((d)=>{
    return d!=req.user.username;
 })




await Account.findByIdAndUpdate(id,{followers:data});

let data2=mai.following;

data2=data2.filter((d)=>{
    return d!=other.username.username;
})


await Account.findOneAndUpdate({username:req.user._id},{following:data2});



 res.redirect(`/getFollowing/${mai._id}`);

}))



app.get("/getFollowing/:id",isLogged,asyncWrap(async(req,res)=>{
    let{id}=req.params;
    let data=await Account.findOne({username:req.user._id}).populate('username');
let d=await Account.findOne({_id:id});
let arr=d.following;
let ans=[];


let pro=arr.map(async(user)=>{
   let us=await User.findOne({username:user});
   let acc=await Account.findOne({username:us._id}).populate('username');
   ans.push(acc);
})

await Promise.all(pro);

res.render("list/following.ejs",{ans,data,root:d.username._id});
}))



app.get("/getFollowers/:id",isLogged,asyncWrap(async(req,res)=>{
let{id}=req.params;

let data=await Account.findOne({username:req.user._id}).populate('username');
let d=await Account.findOne({_id:id});
let arr=d.followers;
let ans=[];

let pro=arr.map(async(user)=>{
   let us=await User.findOne({username:user});
   let acc=await Account.findOne({username:us._id}).populate('username');
   ans.push(acc);
})

await Promise.all(pro);


res.render("list/follower.ejs",{ans,data,root:d.username._id});
}))




app.get("/message/:id",isLogged,asyncWrap(async(req,res)=>{
    let{id}=req.params;
    let data=await Account.findOne({username:req.user._id}).populate('username');

    let arr=data.followers;
    for( let a of data.following){
        if(!arr.includes(a)){
            arr.push(a);
        }
    }
    let ans=[];
    
    let pro=arr.map(async(user)=>{
       let us=await User.findOne({username:user});
       let acc=await Account.findOne({username:us._id}).populate('username');
       ans.push(acc);
    })

await Promise.all(pro);

  

    res.render("list/allChat.ejs",{data,ans});
}))







app.get("/insta",isLogged,asyncWrap(async(req,res)=>{
    let posts=await Post.find({}).populate('author');
    let data=await Account.findOne({username:req.user._id}).populate("username")

    res.render('list/insta.ejs',{posts,data});

}))

app.get("/instagram",isLogged,asyncWrap( async(req,res)=>{
    let{id}=req.params;
   
    let data=await Account.findOne({username:req.user._id}).populate('username');
    let dem=await Account.findOne({username:req.user._id}).populate('username');
    
    let posts=await Post.find({author:req.user._id});

  
    res.render("list/account.ejs",{dem,data,posts});

}))

app.get("/createPost/:id",isLogged,asyncWrap(async(req,res)=>{
    let {id}=req.params;
    let data=await Account.findOne({username:req.user._id}).populate('username');
    res.render("list/create.ejs",{id,data});
}));

app.get("/editProf/:id",isLogged,asyncWrap(async(req,res)=>{
let{id}=req.params;
let data=await Account.findOne({_id:id});
res.render('list/editProfile.ejs',{data});
}))

app.put("/editProf/:id",isLogged,asyncWrap( async(req,res)=>{
    let{id}=req.params;
    profileSchema.validate(req.body);
    let {pic,bio}=req.body;

   
    let data=await Account.findByIdAndUpdate(id,{$set:{pic:pic,bio:bio}},{runValidators:true,new:true});
    

    res.redirect("/instagram");
}))


app.post("/like/:id",isLogged,asyncWrap( async(req,res)=>{
    let {id}=req.params;
    // console.log(id);
    let data=await Post.findOne({_id:id});
    
    let likesArray=data.like;

    let d={};

    if(!likesArray.includes(req.user.username)){
 d=await Post.findByIdAndUpdate(id,{like:[...likesArray,req.user.username]},{new:true});
    }
    else{
        likesArray=likesArray.filter((ele)=>{
            return ele!=req.user.username;
        })
        d=await Post.findByIdAndUpdate(id,{like:[...likesArray]},{new:true});
    }

  
    res.json({val:d.like.length});
})
)



app.post("/createPost/:id",isLogged,asyncWrap(async(req,res)=>{
    // let{id}=req.params;
    let {url,caption}=req.body;
    let newPost= new Post({
      author:req.user._id,
      url:url,
      like:[],
      caption:caption 
    })
    await newPost.save();
    res.redirect('/insta')
}))


app.get("/signup",(req,res)=>{
    res.render("list/sign.ejs");
})
app.post("/sign",asyncWrap(async(req,res)=>{
    try{
   let {mail,username,password}=req.body;

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
}
catch(e){
    req.flash("error",e.message);
    res.redirect('/signup');
}
}))

app.post('/saveImg',isLogged,asyncWrap(async(req,res,next)=>{

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
    // req.flash("success","sing up done");
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


app.get("/getChats/:id/:user",asyncWrap(async(req,res)=>{
    let{id,user}=req.params;

    let chats =await Chat.find({$or:[ { $and :[ {receiver:id} ,{sender:user}  ]  } ,  { $and :[ {sender:id} ,{receiver:user}  ]   } ]}).populate('sender').populate('receiver');

    let rec=await Account.findById(id).populate('username');


    let name=rec.username.username;
    let url=rec.pic;


    
    res.json({chats:chats,name:name,url:url});
}))


let users={};


io.on('connection',(socket)=>{

    socket.on('register',(id)=>{
        users[id] = socket.id; 
    })

    socket.on('chat mess',async({from, to,mess})=>{
    
        let chat=new Chat({
            sender:from,
            receiver:to,
            content:mess,
        });
        await chat.save();

        const recipientSocketId = users[to]; // Get th\e socketId of the recipient
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('chat mess', { message: mess,from:from,to:to });
           

        } 

        io.to(socket.id).emit('chat mess', {message: mess,from:from,to:to  });


    })

    // io.emit('chat mess',)


})



app.use((err,req,res,next)=>{
    console.log(err);
    res.send("error occurs");
})


app.get("*",(req,res)=>{

res.send("Page Not found");
})






server.listen(8080,()=>{
    console.log("insta listen");
})