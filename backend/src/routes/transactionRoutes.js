const express = require("express");

const {
  query,
  param,
} = require("express-validator");

const {
  getAllTransactions,
  getTransactionById,
} = require("../controllers/transactionController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const transactionFilterValidation = [
  query("type")
    .optional({ checkFalsy: true })
    .isIn([
      "Stock In",
      "Stock Out",
    ])
    .withMessage(
      "Type must be Stock In or Stock Out."
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

  query("itemId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage(
      "Item ID must be a valid positive integer."
    ),

  validateRequest,
];

const transactionIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "Transaction ID must be a valid positive integer."
    ),

  validateRequest,
];


/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all stock transactions
 *     description: Retrieve stock-in and stock-out transaction history. Optional filters can be used.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Stock In
 *             - Stock Out
 *         description: Filter transactions by type
 *         example: Stock In
 *
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *         example: 2026-09-01
 *
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions up to this date
 *         example: 2026-09-06
 *
 *       - in: query
 *         name: itemId
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter transactions by item ID
 *         example: 2
 *
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       400:
 *         description: Invalid filter value
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  transactionFilterValidation,
  getAllTransactions
);


/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Transaction ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  transactionIdValidation,
  getTransactionById
);

module.exports = router;