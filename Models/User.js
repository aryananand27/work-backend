const mongoose=require('mongoose');
const bcrypt=require('bcrypt');

const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        require:[true,"Username Field is required."],
        unique:[true,"Username Already exists."]
    },
    email:{
        type:String,
        require:[true,"Email Field is required."],
        unique:[true,"Email Already exists."]
    },
    password:{
        type:String,
        require:[true,"Password Field is required."],
        unique:[true,"Password Already exists."]
    }
})
UserSchema.pre('save',async function(next){
    this.password=await bcrypt.hash(this.password,10);
   
    next();
})
module.exports=mongoose.model('banaousers',UserSchema);