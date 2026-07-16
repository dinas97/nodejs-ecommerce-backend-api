const Wishlist = require('../models/Wishlist.model');

const findOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// ---------------------------------------------------------
// GET /wishlists/my — User
// ---------------------------------------------------------
exports.getMyWishlist = async (req, res) => {
  try {
    const wishlist = await findOrCreateWishlist(req.user._id);
    return res.status(200).json({ success: true, wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /wishlists/add/:productId — User
// ---------------------------------------------------------
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await findOrCreateWishlist(req.user._id);

    const alreadyAdded = wishlist.products.some(
      (id) => id.toString() === productId,
    );

    if (alreadyAdded) {
      return res.status(409).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /wishlists/remove/:productId — User
// ---------------------------------------------------------
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId,
    );
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /wishlists/clear — User
// ---------------------------------------------------------
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = [];
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
