const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
 cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.UPLOAD_API_KEY,
  api_secret: process.env.UPLOAD_API_SECRET,
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads'
    },
  });
  const upload = multer({ storage: storage });
  module.exports=upload;