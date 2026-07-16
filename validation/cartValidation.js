const Joi = require('joi');

// Used for POST /carts/items
const addItemSchema = Joi.object({
  productId: Joi.string().length(24).hex().required(),
  quantity: Joi.number().integer().min(1).required(),
});

// Used for PATCH /carts/items
const updateItemSchema = Joi.object({
  productId: Joi.string().length(24).hex().required(),
  quantity: Joi.number().integer().min(1).required(),
});

// Used for POST /carts/coupon
const applyCouponSchema = Joi.object({
  code: Joi.string().required(),
});

module.exports = { addItemSchema, updateItemSchema, applyCouponSchema };
