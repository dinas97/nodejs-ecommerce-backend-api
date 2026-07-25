const Joi = require('joi');

// Used for POST /orders
const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    country: Joi.string().required(),
    city: Joi.string().required(),
    address: Joi.string().required(),
    postalCode: Joi.string().allow(''),
  }).required(),
  paymentMethod: Joi.string().valid('cash').messages({
    'any.only':
      'Only cash payment is currently supported. Online payment methods are coming soon.',
  }),
  customerNote: Joi.string().max(1000).allow(''),
});

// Used for PATCH /orders/admin/:id/status
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
    )
    .required(),
  adminNote: Joi.string().max(1000).allow(''),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
