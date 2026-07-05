const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const generateOTP = require('../utils/generateOTP');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const OTP_EXPIRY_MINUTES = 10;

// ---------------------------------------------------------
// POST /auth/register/send-otp — Public
// ---------------------------------------------------------
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'register' });

    const otpCode = generateOTP();

    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'register',
      userData: { username, email: email.toLowerCase(), password },
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email — Ecommerce API',
      html: `<p>Your verification code is <b>${otpCode}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/verify-otp — Public
// ---------------------------------------------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'register',
    }).select('+otp');

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email',
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired, please register again',
      });
    }

    const isMatch = await otpDoc.compareOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const { username, password } = otpDoc.userData;

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      isVerified: true,
    });

    await otpDoc.deleteOne();

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account verified and created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/login — Public
// ---------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password',
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/logout — Private (User)
// ---------------------------------------------------------
exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// ---------------------------------------------------------
// POST /auth/forgotpassword/send-otp — Public
// ---------------------------------------------------------
exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    await OTP.deleteMany({
      email: email.toLowerCase(),
      purpose: 'resetPassword',
    });

    const otpCode = generateOTP();

    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'resetPassword',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await sendEmail({
      to: email,
      subject: 'Reset your password — Ecommerce API',
      html: `<p>Your password reset code is <b>${otpCode}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/forgotpassword/verify-otp — Public
// ---------------------------------------------------------
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'resetPassword',
    }).select('+otp');

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset found for this email',
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res
        .status(400)
        .json({ success: false, message: 'OTP has expired' });
    }

    const isMatch = await otpDoc.compareOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    user.password = newPassword; // pre('save') hook re-hashes it
    await user.save();

    await otpDoc.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully, you can now log in',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /auth/me — Private (User)
// ---------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
