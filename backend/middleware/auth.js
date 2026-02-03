const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Token usually comes as "Bearer <token>"
  const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenString, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.adminId = decoded.id;
    next();
  });
};

module.exports = { verifyToken };
