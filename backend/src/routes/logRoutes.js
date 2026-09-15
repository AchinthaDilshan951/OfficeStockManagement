const express = require("express");

const {
  query,
  param,
} = require("express-validator");

const {
  getAllLogs,
  getLogById,
} = require("../controllers/logController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const logFilterValidation = [
  query("action")
    .optional({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage(
      "Action cannot exceed 50 characters."
    ),

  query("module")
    .optional({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage(
      "Module cannot exceed 50 characters."
    ),

  query("logLevel")
    .optional({ checkFalsy: true })
    .isIn([
      "INFO",
      "WARNING",
      "ERROR",
    ])
    .withMessage(
      "Log level must be INFO, WARNING or ERROR."
    ),

  query("fromDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage(
      "From date must be a valid date."
    ),

  query("toDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage(
      "To date must be a valid date."
    ),

  validateRequest,
];

const logIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "Log ID must be a valid positive integer."
    ),

  validateRequest,
];


/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get system activity logs
 *     description: Retrieve system logs with optional filters. Only Admin users can access this endpoint.
 *     tags:
 *       - Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter logs by action
 *         example: LOGIN
 *
 *       - in: query
 *         name: module
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter logs by module
 *         example: Authentication
 *
 *       - in: query
 *         name: logLevel
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - INFO
 *             - WARNING
 *             - ERROR
 *         description: Filter logs by log level
 *         example: INFO
 *
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *         example: 2026-09-01
 *
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs up to this date
 *         example: 2026-09-06
 *
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       400:
 *         description: Invalid filter value
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  logFilterValidation,
  getAllLogs
);


/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: Get a log by ID
 *     description: Retrieve a single system log record by its ID. Only Admin users can access this endpoint.
 *     tags:
 *       - Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Log ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Log retrieved successfully
 *       400:
 *         description: Invalid log ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Log not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  logIdValidation,
  getLogById
);

module.exports = router;