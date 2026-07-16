const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const COUPONS = require('../constants/coupons');

// Helper: find the user's cart, or create an empty one automatically
// if it doesn't exist yet — matches "GET /carts creates one automatically"
const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// ---------------------------------------------------------
// GET /carts — User
// ---------------------------------------------------------
exports.getCart = async (req, res) => {
  try {
    const cart = await findOrCreateCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /carts/items — User
// Adds a product to the cart. Only CHECKS the product's stock to make
// sure enough units exist — does NOT deduct anything from stock.
// Stock is only ever touched when an actual order is placed.
// ---------------------------------------------------------
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    const cart = await findOrCreateCart(req.user._id);

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    // The quantity the user is TRYING to end up with in the cart
    const targetQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    // Read-only check: is there enough stock for this quantity?
    // We never modify product.stock here.
    if (targetQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = targetQuantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price:
          product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PATCH /carts/items — User
// Sets a NEW absolute quantity for an item already in the cart.
// Only CHECKS stock availability — does NOT modify product.stock.
// ---------------------------------------------------------
exports.updateItemQuantity = async (req, res) => {
  try {
    const { productId, quantity: newQuantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: 'Item not found in cart' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    // Read-only check: is enough stock available for the new quantity?
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    item.quantity = newQuantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart item quantity updated',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /carts/items/:productId — User
// Removes an item from the cart. Does NOT touch product stock —
// nothing was ever deducted when the item was added.
// ---------------------------------------------------------
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: 'Cart not found' });
    }

    const itemExists = cart.items.some(
      (i) => i.product.toString() === productId,
    );
    if (!itemExists) {
      return res
        .status(404)
        .json({ success: false, message: 'Item not found in cart' });
    }

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /carts/coupon — User
// ---------------------------------------------------------
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const upperCode = code.toUpperCase();

    const matchedCoupon = COUPONS[upperCode];
    if (!matchedCoupon) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid coupon code' });
    }

    const cart = await findOrCreateCart(req.user._id);

    cart.coupon = {
      code: upperCode,
      discountType: matchedCoupon.discountType,
      discountValue: matchedCoupon.discountValue,
    };

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /carts/coupon — User
// ---------------------------------------------------------
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: 'Cart not found' });
    }

    cart.coupon = { code: null, discountType: null, discountValue: 0 };
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon removed',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /carts/clear — User
// Clears all items and the coupon. Does NOT touch product stock —
// nothing was ever deducted when items were added.
// ---------------------------------------------------------
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    cart.coupon = { code: null, discountType: null, discountValue: 0 };
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
