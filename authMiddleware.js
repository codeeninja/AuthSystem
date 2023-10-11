// authMiddleware.js
const jwt = require("jsonwebtoken");
const key = "mykey";

function verifyToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { verifyToken };
