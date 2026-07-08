const User = require('../models/User.model');
const cloudinary = require('../config/cloudinary');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// ---------------------------------------------------------
// POST /users/add — Admin only
// ---------------------------------------------------------
exports.addUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
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
// GET /users/all — Admin only
// ---------------------------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-addresses -wishlist');

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /users/:id — Admin only
// ---------------------------------------------------------
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PATCH /users/:id — Owner only
// Sent as multipart/form-data. Supports username, phone, addresses,
// and an optional avatar image file. Password is intentionally excluded.
// ---------------------------------------------------------
exports.updateUser = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    const { username, phone, addresses } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (phone !== undefined) updates.phone = phone;

    if (addresses) {
      try {
        updates.addresses = JSON.parse(addresses);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'addresses must be a valid JSON array string',
        });
      }
    }

    // If an image file was uploaded, send it to Cloudinary and store the URL
    if (req.file) {
      const user = await User.findById(req.params.id);

      // Delete the old avatar from Cloudinary first, if one exists and
      // isn't just the default placeholder image
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }

      const { public_id, url } = await uploadToCloudinary(req.file.buffer);
      updates.avatar = url;
      updates.avatarPublicId = public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /users/:id — Admin only
// ---------------------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /users/change-password — Owner only
// No OTP or email involved — the user proves identity by providing
// their current password directly. Admins cannot call this for anyone
// else, since it always acts on req.user (the logged-in user).
// ---------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword; // pre('save') hook re-hashes it
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
