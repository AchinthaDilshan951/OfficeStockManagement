const express = require("express");

const {
  query,
} = require("express-validator");

const {
  getReportSummary,
  getDailyReport,
  getMonthlyReport,
  getLowStockReport,
} = require("../controllers/reportController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const dailyReportValidation = [
  query("date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage(
      "Date must be a valid date in YYYY-MM-DD format."
    ),

  validateRequest,
];

const monthlyReportValidation = [
  query("year")
    .optional({ checkFalsy: true })
    .isInt({
      min: 2000,
      max: 2100,
    })
    .withMessage(
      "Year must be between 2000 and 2100."
    ),

  query("month")
    .optional({ checkFalsy: true })
    .isInt({
      min: 1,
      max: 12,
    })
    .withMessage(
      "Month must be between 1 and 12."
    ),

  validateRequest,
];


/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     summary: Get overall stock report summary
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report summary retrieved successfully
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 */
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  getReportSummary
);


/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     summary: Get daily stock report
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for the daily report
 *         example: 2026-09-06
 *     responses:
 *       200:
 *         description: Daily report retrieved successfully
 *       400:
 *         description: Invalid date
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 */
router.get(
  "/daily",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  dailyReportValidation,
  getDailyReport
);


/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     summary: Get monthly stock report
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Year of the report
 *         example: 2026
 *
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number of the report
 *         example: 9
 *
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
 *       400:
 *         description: Invalid year or month
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 */
router.get(
  "/monthly",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  monthlyReportValidation,
  getMonthlyReport
);


/**
 * @swagger
 * /api/reports/low-stock:
 *   get:
 *     summary: Get low-stock items report
 *     description: Returns items where the available quantity is at or below the reorder level.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low-stock report retrieved successfully
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 */
router.get(
  "/low-stock",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  getLowStockReport
);

module.exports = router;