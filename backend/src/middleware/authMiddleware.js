const jwt = require("jsonwebtoken");

const authenticateToken = (
  req,
  res,
  next
) => {
  const authorizationHeader =
    req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication token is required.",
    });
  }

  const parts =
    authorizationHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer" ||
    !parts[1]
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid authorization format. Use Bearer token.",
    });
  }

  const token = parts[1];

  try {
    const decodedToken =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name ===
        "TokenExpiredError"
          ? "Authentication token has expired."
          : "Invalid authentication token.",
    });
  }
};

module.exports =
  authenticateToken;