const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true },
);

// Auto-populate full product details on every find query, so the client
// always gets complete product info without needing a second request.
wishlistSchema.pre(/^find/, function (next) {
  this.populate('products');
  next();
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
