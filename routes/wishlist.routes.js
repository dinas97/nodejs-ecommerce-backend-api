const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require('../controllers/wishlistController');

router.get('/my', auth, getMyWishlist);
router.post('/add/:productId', auth, addToWishlist);
router.delete('/remove/:productId', auth, removeFromWishlist);
router.delete('/clear', auth, clearWishlist);

module.exports = router;
