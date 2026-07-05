const Joi = require('joi');

// Used for POST /auth/register/send-otp
const registerSchema = Joi.object({
  username: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
    }),
});

// Used for POST /auth/verify-otp
const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

// Used for POST /auth/login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Used for POST /auth/forgotpassword/send-otp
const forgotPasswordSendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

// Used for POST /auth/forgotpassword/verify-otp
const forgotPasswordVerifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
    }),
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
};
