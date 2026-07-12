const uploadToCloudinary = require('./uploadToCloudinary');
const deleteFromCloudinary = require('./deleteFromCloudinary');

// Uploads multiple file buffers to Cloudinary in parallel.
// If ANY of them fails, we roll back (delete) the ones that DID succeed —
// this prevents orphaned images from piling up on Cloudinary when a
// product ends up not being created/updated due to a partial failure.
const uploadMultipleToCloudinary = async (files, folder = 'products') => {
  const results = await Promise.allSettled(
    files.map((file) => uploadToCloudinary(file.buffer, folder)),
  );

  const succeeded = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  const failed = results.filter((result) => result.status === 'rejected');

  if (failed.length > 0) {
    if (succeeded.length > 0) {
      await deleteFromCloudinary(succeeded.map((img) => img.public_id));
    }
    throw new Error(
      `${failed.length} of ${files.length} image(s) failed to upload. Please try again.`,
    );
  }

  return succeeded;
};

module.exports = uploadMultipleToCloudinary;
