const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
} = require('../controllers/orderController');

const {
  getDashboardStats,
  getAllCartsAdmin,
} = require('../controllers/adminController');

const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validation/orderValidation');

// --- Admin routes ---
// IMPORTANT: /admin/dashboard and /admin/carts must come BEFORE /admin/:id,
// otherwise Express would treat "dashboard" or "carts" as an :id value.
router.get('/admin/dashboard', auth, adminOnly, getDashboardStats);
router.get('/admin/carts', auth, adminOnly, getAllCartsAdmin);
router.get('/admin/:id', auth, adminOnly, adminGetOrderById);
router.get('/admin', auth, adminOnly, adminGetAllOrders);
router.patch(
  '/admin/:id/status',
  auth,
  adminOnly,
  validate(updateOrderStatusSchema),
  adminUpdateOrderStatus,
);

// --- User routes ---
router.post('/', auth, validate(createOrderSchema), createOrder);
router.get('/my', auth, getMyOrders);
router.get('/my/:id', auth, getMyOrderById);
router.patch('/my/:id/cancel', auth, cancelMyOrder);

module.exports = router;
