const Joi = require('joi');

// Used for POST /products (admin creates a product)
// Sent as multipart/form-data — images come through req.files, not the body.
const createProductSchema = Joi.object({
  name: Joi.string().max(200).required(),
  shortDescription: Joi.string().max(500).required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0),
  stock: Joi.number().min(0).required(),
  sku: Joi.string().allow(''),
  category: Joi.string().required(),
  subcategory: Joi.string().allow(''),
  brand: Joi.string().allow(''),
  tags: Joi.string(), // sent as a JSON string inside form-data, parsed in the controller
  featured: Joi.boolean(),
  isActive: Joi.boolean(),
});

// Used for PUT /products/update/:id (admin updates a product)
const updateProductSchema = Joi.object({
  name: Joi.string().max(200),
  shortDescription: Joi.string().max(500),
  description: Joi.string(),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0),
  stock: Joi.number().min(0),
  sku: Joi.string().allow(''),
  category: Joi.string(),
  subcategory: Joi.string().allow(''),
  brand: Joi.string().allow(''),
  tags: Joi.string(),
  featured: Joi.boolean(),
  isActive: Joi.boolean(),
  // JSON string array of public_ids to remove, e.g. '["id1","id2"]'
  deleteImages: Joi.string(),
});

// Used for POST /products/:id/reviews
const addReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).required(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  addReviewSchema,
};
