const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

const {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
} = require('../controllers/userController');

const {
  addUserSchema,
  updateUserSchema,
  changePasswordSchema,
} = require('../validation/userValidation');

// --- Change password (owner only, no OTP — verifies currentPassword) ---
router.post(
  '/change-password',
  auth,
  validate(changePasswordSchema),
  changePassword,
);

// --- Admin only ---
router.post('/add', auth, adminOnly, validate(addUserSchema), addUser);
router.get('/all', auth, adminOnly, getAllUsers);
router.get('/:id', auth, adminOnly, getUserById);
router.delete('/:id', auth, adminOnly, deleteUser);

// --- Owner only (multipart/form-data, supports avatar upload) ---
router.patch(
  '/:id',
  auth,
  upload.single('avatar'),
  validate(updateUserSchema),
  updateUser,
);

module.exports = router;
