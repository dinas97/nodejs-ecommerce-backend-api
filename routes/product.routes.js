const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

const {
  getAllProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  getReviews,
} = require('../controllers/productController');

const {
  createProductSchema,
  updateProductSchema,
  addReviewSchema,
} = require('../validation/productValidation');

// --- Public routes ---
// IMPORTANT: /search must come BEFORE /:id, otherwise Express would think
// "search" is a product id.
router.get('/search', searchProducts);
router.get('/:id/reviews', getReviews);
router.get('/:id', getProductById);
router.get('/', getAllProducts);

// --- Admin only ---
router.post(
  '/',
  auth,
  adminOnly,
  upload.array('images', 10),
  validate(createProductSchema),
  createProduct,
);
router.put(
  '/update/:id',
  auth,
  adminOnly,
  upload.array('images', 10),
  validate(updateProductSchema),
  updateProduct,
);
router.delete('/:id', auth, adminOnly, deleteProduct);

// --- Logged-in users ---
router.post('/:id/reviews', auth, validate(addReviewSchema), addReview);
router.delete('/:id/reviews/:rid', auth, deleteReview);

module.exports = router;
