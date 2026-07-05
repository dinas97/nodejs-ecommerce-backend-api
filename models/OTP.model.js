const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    userData: {
      type: Object,
      default: null,
    },
    purpose: {
      type: String,
      enum: ['register', 'resetPassword'],
      default: 'register',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.pre('save', async function () {
  if (!this.isModified('otp')) return;
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

otpSchema.methods.compareOTP = async function (enteredOtp) {
  return bcrypt.compare(enteredOtp, this.otp);
};

module.exports = mongoose.model('OTP', otpSchema);
