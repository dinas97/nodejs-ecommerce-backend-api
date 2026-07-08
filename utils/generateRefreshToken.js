const jwt = require('jsonwebtoken');

// Generates a long-lived refresh token, signed with its OWN secret
// (separate from the access token secret). This way, even if the
// access token secret is ever compromised, refresh tokens stay safe.
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
  });
};

module.exports = generateRefreshToken;
