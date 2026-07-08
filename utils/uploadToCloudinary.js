const cloudinary = require('../config/cloudinary');

// Uploads a file buffer (from multer's memory storage) to Cloudinary
// and returns { public_id, url } to store on the User document.
const uploadToCloudinary = (fileBuffer, folder = 'avatars') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({ public_id: result.public_id, url: result.secure_url });
      },
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;
