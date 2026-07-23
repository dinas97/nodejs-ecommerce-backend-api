const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require('../controllers/wishlistController');

const {
  getAllWishlistsAdmin,
  getWishlistStats,
} = require('../controllers/adminController');

// --- Admin routes ---
router.get('/admin/stats', auth, adminOnly, getWishlistStats);
router.get('/admin/all', auth, adminOnly, getAllWishlistsAdmin);

// --- User routes ---
router.get('/my', auth, getMyWishlist);
router.post('/add/:productId', auth, addToWishlist);
router.delete('/remove/:productId', auth, removeFromWishlist);
router.delete('/clear', auth, clearWishlist);

module.exports = router;
