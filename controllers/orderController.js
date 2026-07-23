const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');

const SHIPPING_THRESHOLD = 1000; // EGP
const SHIPPING_FEE = 50;
const TAX_RATE = 0.14;

// ---------------------------------------------------------
// POST /orders — User
// Creates an order from the user's current cart, inside a Mongoose
// Transaction: validates + deducts stock for every item, creates the
// order, and clears the cart — all together, or none of it at all.
// ---------------------------------------------------------
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({ user: req.user._id }).session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: 'Your cart is empty' });
    }

    const { shippingAddress, paymentMethod, customerNote } = req.body;

    // Validate AND deduct stock atomically for every item, one by one.
    // findOneAndUpdate with a stock >= quantity condition prevents a race
    // condition where two requests could both "pass" a separate stock
    // check and then both deduct, taking stock negative.
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, new: true },
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}"`,
        });
      }
    }

    // Compute pricing — done here in the controller (see the note in
    // Order.model.js about why this isn't a pre-save hook)
    const subtotal = cart.subtotal;
    const discount = cart.discountAmount;
    const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalPrice =
      Math.round((subtotal + shippingFee + tax - discount) * 100) / 100;

    const orderData = {
      user: req.user._id,
      items: cart.items.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress,
      paymentMethod: paymentMethod || 'cash',
      subtotal,
      shippingFee,
      tax,
      discount,
      totalPrice,
      customerNote,
    };

    const createdOrders = await Order.create([orderData], { session });
    const order = createdOrders[0];

    // Only clear the cart AFTER the order is successfully persisted
    cart.items = [];
    cart.coupon = { code: null, discountType: null, discountValue: 0 };
    await cart.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// ---------------------------------------------------------
// GET /orders/my — User
// Supports pagination and status filter
// ---------------------------------------------------------
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page, limit } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /orders/my/:id — User (owner only)
// ---------------------------------------------------------
exports.getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PATCH /orders/my/:id/cancel — User (owner only)
// Only allowed while status is pending or confirmed. Restores stock
// for every item in the order.
// ---------------------------------------------------------
exports.cancelMyOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order can no longer be cancelled (current status: ${order.status})`,
      });
    }

    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session },
        ),
      ),
    );

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully, stock has been restored',
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// ---------------------------------------------------------
// GET /orders/admin/all — Admin
// Filters by status, payment status, date range; supports sorting + pagination
// ---------------------------------------------------------
exports.adminGetAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, from, to, sort, page, limit } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest_total: { totalPrice: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'username email')
        .sort(sortBy)
        .skip(skip)
        .limit(pageSize),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /orders/admin/:id — Admin
// ---------------------------------------------------------
exports.adminGetOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'username email',
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PATCH /orders/admin/:id/status — Admin
// Updates order status and emails the customer automatically
// ---------------------------------------------------------
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (adminNote !== undefined) order.adminNote = adminNote;

    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }
    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date();
    }

    await order.save();

    await sendEmail({
      to: order.user.email,
      subject: 'Your order status has been updated — Ecommerce API',
      html: `<p>Hi ${order.user.username},</p><p>Your order <b>${order._id}</b> status is now: <b>${status}</b>.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: 'Order status updated and customer notified by email',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
