const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Sub-schema for shipping addresses (embedded, no separate collection)
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(value) {
          return validator.isEmail(value);
        },
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // never return password in queries by default
      validate(value) {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;

        if (!passwordRegex.test(value)) {
          throw new Error(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          );
        }
      },
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/demo/image/upload/default-avatar.png',
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  },
);

// --- Hooks ---

// Hash the password before saving, only if it was modified (or is new)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- Instance Methods ---

// Compare a plain-text password against the stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
