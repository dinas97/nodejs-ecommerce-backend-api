const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const generateOTP = require('../utils/generateOTP');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const generateResetToken = require('../utils/generateResetToken');
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

    return res.status(201).json({
      success: true,
      message: 'Account verified and created successfully. Please log in.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
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
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/refresh-token — Public (reads the httpOnly cookie)
// ---------------------------------------------------------
exports.refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided, please log in again',
      });
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists, please log in again',
      });
    }

    const newAccessToken = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      token: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token, please log in again',
    });
  }
};

// ---------------------------------------------------------
// POST /auth/logout — Private (User)
// ---------------------------------------------------------
exports.logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// ---------------------------------------------------------
// POST /auth/forgotpassword/send-token — Public
// ---------------------------------------------------------
exports.sendForgotPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    const { rawToken, hashedToken } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    );
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Reset your password — Ecommerce API',
      html: `<p>Your password reset code is <b>${rawToken}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token sent to your email',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /auth/forgotpassword/verify-token — Public
// ---------------------------------------------------------
exports.verifyForgotPasswordToken = async (req, res) => {
  try {
    const { email, token: resetToken, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+resetPasswordToken +resetPasswordExpire',
    );

    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset found for this email',
      });
    }

    if (user.resetPasswordExpire < new Date()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res
        .status(400)
        .json({ success: false, message: 'Reset token has expired' });
    }

    const hashedIncomingToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    if (hashedIncomingToken !== user.resetPasswordToken) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
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
