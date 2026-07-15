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

// Used for POST /auth/forgotpassword/send-token
const forgotPasswordSendTokenSchema = Joi.object({
  email: Joi.string().email().required(),
});

// Used for POST /auth/forgotpassword/verify-token
const forgotPasswordVerifyTokenSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().length(64).required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
    }),
});

// Used for POST /users/add (admin creates a user directly)
const addUserSchema = Joi.object({
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
  role: Joi.string().valid('admin', 'customer'),
});

// Used for PATCH /users/:id (user updates their own profile)
// Sent as multipart/form-data because it may include an image file.
// Note: no password here — that goes through the dedicated change-password route.
const updateUserSchema = Joi.object({
  username: Joi.string().min(2).max(50),
  phone: Joi.string().allow(''),
  addresses: Joi.string(), // sent as a JSON string inside form-data, parsed in the controller
});

// Used for POST /users/change-password
// No OTP — the user proves identity by providing their current password.
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
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
  forgotPasswordSendTokenSchema,
  forgotPasswordVerifyTokenSchema,
  addUserSchema,
  updateUserSchema,
  changePasswordSchema,
};
