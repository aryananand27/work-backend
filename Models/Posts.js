const mongoose=require('mongoose');

const PostSchema=new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
    name:{
        type:String,
        require:true
    },
    image:{
        type:String,
        require:true
    },
    likecount:{
        type:Number,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    date:{
        type:String,
        default:new Date().toDateString()
    },
    comments:[
        {
            name:String,
            message:String
        }
    ]

});

module.exports=mongoose.model('posts',PostSchema);