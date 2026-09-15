const express = require("express");

const {
  body,
} = require("express-validator");

const {
  register,
  login,
  changePassword,
} = require("../controllers/authController");

const validateRequest = require(
  "../middleware/validateRequest"
);

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
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
 *               - password
 *               - department
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sample Employee
 *               username:
 *                 type: string
 *                 example: employee1
 *               email:
 *                 type: string
 *                 example: employee1@gmail.com
 *               password:
 *                 type: string
 *                 example: Employee123
 *               phone:
 *                 type: string
 *                 example: "0712345678"
 *               department:
 *                 type: string
 *                 example: Administration
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Username or email already exists
 */
router.post(
  "/register",
  [
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage(
        "Full name is required."
      )
      .isLength({
        min: 3,
        max: 100,
      })
      .withMessage(
        "Full name must contain 3 to 100 characters."
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
        /^[a-zA-Z0-9_]+$/
      )
      .withMessage(
        "Username can contain only letters, numbers and underscores."
      ),

    body("email")
      .trim()
      .isEmail()
      .withMessage(
        "A valid email address is required."
      ),

    body("phone")
      .optional({
        checkFalsy: true,
      })
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
      ),

    body("password")
      .isLength({
        min: 6,
      })
      .withMessage(
        "Password must contain at least 6 characters."
      ),

    validateRequest,
  ],
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: Example123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid username or password
 */
router.post(
  "/login",
  [
    body("username")
      .trim()
      .notEmpty()
      .withMessage(
        "Username is required."
      ),

    body("password")
      .notEmpty()
      .withMessage(
        "Password is required."
      ),

    validateRequest,
  ],
  login
);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change the authenticated user's password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: CurrentPass123
 *               newPassword:
 *                 type: string
 *                 example: NewPass123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPass123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication failed or current password is incorrect
 *       403:
 *         description: Account is inactive
 *       404:
 *         description: User account not found
 */
router.patch(
  "/change-password",

  authMiddleware,

  [
    body("currentPassword")
      .notEmpty()
      .withMessage(
        "Current password is required."
      ),

    body("newPassword")
      .notEmpty()
      .withMessage(
        "New password is required."
      )
      .isLength({
        min: 6,
      })
      .withMessage(
        "New password must contain at least 6 characters."
      ),

    body("confirmPassword")
      .notEmpty()
      .withMessage(
        "Confirm password is required."
      )
      .custom(
        (
          value,
          { req }
        ) => {
          if (
            value !==
            req.body.newPassword
          ) {
            throw new Error(
              "New passwords do not match."
            );
          }

          return true;
        }
      ),

    validateRequest,
  ],

  changePassword
);

module.exports = router;