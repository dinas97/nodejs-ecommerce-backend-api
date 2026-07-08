// Restricts access to admin-only routes. Must run AFTER the `auth` middleware,
// since it relies on req.user being already set.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied, admin privileges required',
    });
  }
  next();
};

module.exports = adminOnly;
