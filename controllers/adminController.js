const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Wishlist = require('../models/Wishlist.model');
const User = require('../models/User.model');

// ---------------------------------------------------------
// GET /admin/dashboard — Admin
// Runs several aggregation pipelines in parallel for the dashboard
// ---------------------------------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRevenueResult,
      thisMonthRevenueResult,
      lastMonthRevenueResult,
      ordersByStatus,
      topProducts,
      dailyRevenue,
      recentOrders,
      totalCustomers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] },
            },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username email'),
      User.countDocuments({ role: 'customer' }),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    const monthOverMonthGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000,
          ) / 10
        : null;

    return res.status(200).json({
      success: true,
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        monthOverMonthGrowthPercent: monthOverMonthGrowth,
      },
      ordersByStatus,
      topProducts,
      dailyRevenue,
      recentOrders,
      totalCustomers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /admin/carts — Admin
// View all active (non-empty) carts with user info and item details
// ---------------------------------------------------------
exports.getAllCartsAdmin = async (req, res) => {
  try {
    const carts = await Cart.find({ 'items.0': { $exists: true } }).populate(
      'user',
      'username email',
    );

    return res.status(200).json({
      success: true,
      count: carts.length,
      carts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /admin/wishlists — Admin (paginated)
// ---------------------------------------------------------
exports.getAllWishlistsAdmin = async (req, res) => {
  try {
    const currentPage = Number(req.query.page) || 1;
    const pageSize = Number(req.query.limit) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [wishlists, total] = await Promise.all([
      Wishlist.find()
        .populate('user', 'username email')
        .skip(skip)
        .limit(pageSize),
      Wishlist.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      count: wishlists.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      wishlists,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /admin/wishlists/stats — Admin
// Top 10 most wishlisted products
// ---------------------------------------------------------
exports.getWishlistStats = async (req, res) => {
  try {
    const stats = await Wishlist.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products', wishlistCount: { $sum: 1 } } },
      { $sort: { wishlistCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          productId: '$product._id',
          name: '$product.name',
          price: '$product.price',
          wishlistCount: 1,
        },
      },
    ]);

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
