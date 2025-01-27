const express=require('express');
const cors=require('cors');
const app=express(); 
require('./DB/config');
require('dotenv').config();
const UserModel=require('./Models/User');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const secretkey=process.env.JWT_SECRET_KEY;
const transporter=require('./email');
const PostModel=require('./Models/Posts');
const {ObjectId}=require('mongodb')
const upload=require('./upload');

app.use(cors());
app.use(express.json());


// Middleware for Authentication through JWT Token.......
const authToken=(req,resp,next)=>{
    let token=req.headers['authorization'];
   
    if(token){
        token=token.split(' ')[1];
        console.log(token);
        jwt.verify(token,secretkey,(err,verify)=>{
            if(err){
                resp.send({reslt:"Please Provide Valid Token."});
            }
            else{
                next();
            }
        });
    }else{
        resp.send({reslt:"Please Provide Token."});
    }
  
}



app.get('/',(req,resp)=>{
    resp.send('connection set up');
})
app.post('/register',async(req,resp)=>{
    try{
        if(req.body.username && req.body.email && req.body.password){
            const result=new UserModel(req.body);
            const token=  jwt.sign({_id:result._id},secretkey,{expiresIn:"1h"});
            const data=await result.save();
            delete data.password;
            resp.send({result:data,token});
        }
        else{
            resp.send({err:"All Field is required.."});
        } 
   }
   catch(error){
    if(error.keyPattern){
        resp.send({err:"User Already Exists."})
    }
    else{
        resp.send(error);
    }
   }
})

app.post('/login',async(req,resp)=>{
    if(req.body.username && req.body.password){
        const result= await UserModel.findOne({username:req.body.username});
        
        if(result){
            const ismatch=await bcrypt.compare(req.body.password,result.password);
            const token=jwt.sign({_id:result._id},secretkey,{expiresIn:"1h"});
            if(ismatch){
                delete result.password;
                resp.send({result,token});
            }
            else{
                resp.send({err:"User Credential is wrong."})
            }
        }
        else{
            resp.send({err:"Username is not found."})
        }
        
    }
    else{
        resp.send({err:"All Field is required."})
    }
})

app.post('/forgot-password',async(req,resp)=>{
    try{
        const userfound=await UserModel.findOne({email:req.body.email});
        if(userfound){
            const token=jwt.sign({_id:userfound._id},secretkey,{expiresIn:"1h"});
            
           
            const info = await transporter.sendMail({
                from:`"Aryan Anand" ${process.env.USER}`,
                to: req.body.email, 
               
                subject: "Reset Password.", 
                html:`Requested to change password of your account. Click Below link </br> <a href="http://localhost:3000/reset/${userfound._id}/${token}">Change Password</a>`
              });
              resp.send({info:info});
        }
        else{
            resp.send({reslt:"User Not Exists."});
        }
        
    }
    catch(error){
        resp.send({reslt:error});
    }
})

app.post('/reset/:id/:token',async(req,resp)=>{
    if(req.body.password){
        req.body.password=await bcrypt.hash(req.body.password,10);
        if(req.params.token){
            
// ***************************** Below Verifying the auth token From mail *********************************** 


            jwt.verify(req.params.token,secretkey,async(err,verify)=>{
                if(err){
                    resp.send({err:"Not Authorized user"});
                }
                else{
                    const result=await UserModel.updateOne({_id:req.params.id},{$set:{password:req.body.password}})
                    resp.send({reslt:"Password Updated Successfully."})
                }
            })
        }
        else{
            resp.send({err:"Provided link is not valid"});
        }
    }
    else{
        resp.send({err:"Field is required."})
    }
    
});

app.post('/posts',authToken,async(req,resp)=>{
    try{
        const result= new PostModel(req.body);
        
        const data=await result.save();
        resp.send({result:data});
    }catch(err){
        resp.send({error:err});
    }
})
app.get('/getposts',authToken,async(req,resp)=>{
    const result=await PostModel.find();
    if(result){
        resp.send(result);
    }
    else{
        resp.send({reslt:"No Data Available."})
    }
})
app.get('/getpost/:id',authToken,async(req,resp)=>{
    if(req.params.id){
        let result=await PostModel.findOne({_id:new ObjectId(req.params.id)});
        if(result){
            resp.send(result);
        }
        else{
            resp.send({reslt:"NotFound"});
        }
    }
    else{
        resp.send({reslt:"Not authorized user."});
    }
})
app.put('/likes/:id',authToken ,async(req,resp)=>{
    if(req.params.id){
        const result=await PostModel.updateOne({_id:new ObjectId(req.params.id)},{$inc:{likecount:1}});
        resp.send(result);
    }
    else{
        resp.send({reslt:"Cannot like post"});
    }
})
app.put('/dislikes/:id',authToken,async(req,resp)=>{
    if(req.params.id){
        const result=await PostModel.updateOne({_id:new ObjectId(req.params.id)},{$inc:{likecount:-1}});
        resp.send(result);
    }
    else{
        resp.send({reslt:"Cannot like post"});
    }
})

app.put('/messages/:id',authToken,async(req,resp)=>{
    if(req.params.id){
        const result=await PostModel.updateOne({_id:new ObjectId(req.params.id)},{$push:{comments:req.body}})
        resp.send({result});
    }
    else{
        resp.send({reslt:"Cannot comment post"});
    }
})

app.post('/upload',  upload.single('file'), (req, res) => {
    try {
      res.send({ fileUrl: req.file.path });
    }
     catch (err) {
      res.send({ err: 'Failed to upload file' });
    }
  });


  app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
    next(); 
})

app.listen(8000);
