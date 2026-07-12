const cloudinary = require('../config/cloudinary');

// Deletes one or more images from Cloudinary by their public_id
const deleteFromCloudinary = async (publicIds) => {
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
  await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
};

module.exports = deleteFromCloudinary;
