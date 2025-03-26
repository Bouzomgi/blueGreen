const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json("Access denied. No token provided.");
  }

  const authToken = token.split(" ")[1];

  if (authToken !== process.env.AUTH_TOKEN) {
    return res.status(403).send("Forbidden. Invalid token.");
  }

  next();
};

module.exports = {
  authenticateToken,
};
