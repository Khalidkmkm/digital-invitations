const jwt = require('jsonwebtoken');

// Kontrollerar om användaren har en giltig token
const authMiddleware = (req, res, next) => {
  // Hämtar token från request headers
  const token = req.header('Authorization');

  // Om ingen token finns
  if (!token) {
    return res.status(401).json({ message: 'Ingen token, åtkomst nekad!' });
  }

  try {
    // Validerar token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next(); // Okej, gå vidare!
  } catch (err) {
    res.status(401).json({ message: 'Ogiltig token!' });
  }
};

module.exports = authMiddleware;