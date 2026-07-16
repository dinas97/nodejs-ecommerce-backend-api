const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  applyCoupon,
  removeCoupon,
  clearCart,
} = require('../controllers/cartController');

const {
  addItemSchema,
  updateItemSchema,
  applyCouponSchema,
} = require('../validation/cartValidation');

router.get('/', auth, getCart);
router.post('/items', auth, validate(addItemSchema), addItem);
router.patch('/items', auth, validate(updateItemSchema), updateItemQuantity);
router.delete('/items/:productId', auth, removeItem);
router.post('/coupon', auth, validate(applyCouponSchema), applyCoupon);
router.delete('/coupon', auth, removeCoupon);
router.delete('/clear', auth, clearCart);

module.exports = router;
