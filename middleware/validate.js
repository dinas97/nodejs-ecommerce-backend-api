// Generic middleware — takes a Joi schema and checks req.body against it.
// Usage: router.post('/login', validate(loginSchema), login);
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  next();
};

module.exports = validate;
