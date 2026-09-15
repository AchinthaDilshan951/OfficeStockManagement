const express = require("express");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/protected",
  authenticateToken,
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "You accessed a protected route.",
      user: req.user,
    });
  }
);

router.get(
  "/admin-only",
  authenticateToken,
  authorizeRoles("Admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "You accessed an admin-only route.",
      user: req.user,
    });
  }
);

router.get(
  "/user-or-admin",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "You accessed a user or admin route.",
      user: req.user,
    });
  }
);

module.exports = router;