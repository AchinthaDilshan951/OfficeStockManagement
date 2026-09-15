const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
} = require("../controllers/userController");

const authenticateToken = require(
  "../middleware/authMiddleware"
);

const authorizeRoles = require(
  "../middleware/roleMiddleware"
);

const validateRequest = require(
  "../middleware/validateRequest"
);

const router = express.Router();

/*
  Allow:
  - Admin to access any user
  - User to access only their own account
*/
const authorizeSelfOrAdmin = (
  req,
  res,
  next
) => {
  const authenticatedUserId =
    Number(
      req.user?.userId ??
        req.user?.user_id ??
        req.user?.id
    );

  const requestedUserId =
    Number(req.params.id);

  const role =
    req.user?.role;

  if (role === "Admin") {
    return next();
  }

  if (
    authenticatedUserId ===
    requestedUserId
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "You do not have permission to access this user account.",
  });
};

const userIdValidation = [
  param("id")
    .isInt({
      min: 1,
    })
    .withMessage(
      "User ID must be a valid positive integer."
    ),

  validateRequest,
];

const userBodyValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage(
      "Full name is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Full name must contain 2 to 100 characters."
    ),

  body("username")
    .trim()
    .notEmpty()
    .withMessage(
      "Username is required."
    )
    .isLength({
      min: 3,
      max: 50,
    })
    .withMessage(
      "Username must contain 3 to 50 characters."
    )
    .matches(
      /^[a-zA-Z0-9._]+$/
    )
    .withMessage(
      "Username may contain only letters, numbers, dots and underscores."
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage(
      "Email is required."
    )
    .isEmail()
    .withMessage(
      "Enter a valid email address."
    ),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage(
      "Phone number is required."
    )
    .matches(
      /^[0-9+\-\s]{7,15}$/
    )
    .withMessage(
      "Enter a valid phone number."
    ),

  body("department")
    .trim()
    .notEmpty()
    .withMessage(
      "Department is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Department must contain 2 to 100 characters."
    ),

  validateRequest,
];

const roleValidation = [
  body("role")
    .notEmpty()
    .withMessage(
      "Role is required."
    )
    .isIn([
      "Admin",
      "User",
    ])
    .withMessage(
      "Role must be Admin or User."
    ),

  validateRequest,
];

const statusValidation = [
  body("status")
    .notEmpty()
    .withMessage(
      "Status is required."
    )
    .isIn([
      "Active",
      "Inactive",
    ])
    .withMessage(
      "Status must be Active or Inactive."
    ),

  validateRequest,
];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",

  authenticateToken,

  authorizeRoles("Admin"),

  getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Admin can view any user. Normal users can view only their own account.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",

  authenticateToken,

  userIdValidation,

  authorizeSelfOrAdmin,

  getUserById
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user details
 *     description: Admin can update any user. Normal users can update only their own account.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - phone
 *               - department
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sample Employee Updated
 *               username:
 *                 type: string
 *                 example: employee1
 *               email:
 *                 type: string
 *                 example: employee1@gmail.com
 *               phone:
 *                 type: string
 *                 example: "0712345678"
 *               department:
 *                 type: string
 *                 example: Finance Department
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       409:
 *         description: Username or email already exists
 */
router.put(
  "/:id",

  authenticateToken,

  userIdValidation,

  authorizeSelfOrAdmin,

  userBodyValidation,

  updateUser
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change a user's role
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   - Admin
 *                   - User
 *                 example: User
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role or protected self-role change
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/role",

  authenticateToken,

  authorizeRoles("Admin"),

  userIdValidation,

  roleValidation,

  updateUserRole
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Change a user's account status
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status or protected self-deactivation
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/status",

  authenticateToken,

  authorizeRoles("Admin"),

  userIdValidation,

  statusValidation,

  updateUserStatus
);

module.exports = router;