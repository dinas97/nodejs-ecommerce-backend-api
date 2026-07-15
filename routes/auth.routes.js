const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

const {
  sendRegisterOtp,
  verifyOtp,
  login,
  logout,
  refreshToken,
  sendForgotPasswordToken,
  verifyForgotPasswordToken,
  getMe,
} = require('../controllers/authController');

const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSendTokenSchema,
  forgotPasswordVerifyTokenSchema,
} = require('../validation/userValidation');

// --- Public routes ---
router.post('/register/send-otp', validate(registerSchema), sendRegisterOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post(
  '/forgotpassword/send-token',
  validate(forgotPasswordSendTokenSchema),
  sendForgotPasswordToken,
);
router.post(
  '/forgotpassword/verify-token',
  validate(forgotPasswordVerifyTokenSchema),
  verifyForgotPasswordToken,
);

// --- Private routes (require a valid JWT) ---
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

module.exports = router;
