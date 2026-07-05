const crypto = require('crypto');

// Generates a random reset token.
// - rawToken: sent to the user by email (never stored anywhere)
// - hashedToken: stored in the database (User.resetPasswordToken)
// This way, even if the database is compromised, the raw token can't be
// recovered from the hash — same principle used for passwords.
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, hashedToken };
};

module.exports = generateResetToken;
