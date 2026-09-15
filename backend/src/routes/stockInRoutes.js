const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllStockInRecords,
  getStockInById,
  createStockIn,
} = require("../controllers/stockInController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const stockInIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "Stock-in ID must be a valid positive integer."
    ),

  validateRequest,
];

const stockInBodyValidation = [
  body("itemId")
    .notEmpty()
    .withMessage("Item ID is required.")
    .isInt({ min: 1 })
    .withMessage(
      "Item ID must be a valid positive integer."
    ),

  body("supplierId")
    .notEmpty()
    .withMessage(
      "Supplier ID is required."
    )
    .isInt({ min: 1 })
    .withMessage(
      "Supplier ID must be a valid positive integer."
    ),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required.")
    .isInt({ min: 1 })
    .withMessage(
      "Quantity must be greater than zero."
    ),

  body("referenceNumber")
    .trim()
    .notEmpty()
    .withMessage(
      "Reference number is required."
    )
    .isLength({
      min: 2,
      max: 50,
    })
    .withMessage(
      "Reference number must contain 2 to 50 characters."
    ),

  body("receivedDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage(
      "Received date must be a valid date."
    ),

  body("note")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Note cannot exceed 1000 characters."
    ),

  validateRequest,
];


/**
 * @swagger
 * /api/stock-in:
 *   get:
 *     summary: Get all stock-in records
 *     tags:
 *       - Stock In
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock-in records retrieved successfully
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
  getAllStockInRecords
);


/**
 * @swagger
 * /api/stock-in/{id}:
 *   get:
 *     summary: Get a stock-in record by ID
 *     tags:
 *       - Stock In
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
 *         description: Stock-in record retrieved successfully
 *       400:
 *         description: Invalid stock-in ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Stock-in record not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  stockInIdValidation,
  getStockInById
);


/**
 * @swagger
 * /api/stock-in:
 *   post:
 *     summary: Add stock to an item
 *     tags:
 *       - Stock In
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - supplierId
 *               - quantity
 *               - referenceNumber
 *             properties:
 *               itemId:
 *                 type: integer
 *                 example: 2
 *               supplierId:
 *                 type: integer
 *                 example: 2
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               referenceNumber:
 *                 type: string
 *                 example: INV-2026-003
 *               receivedDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-06
 *               note:
 *                 type: string
 *                 example: Additional stock received
 *     responses:
 *       201:
 *         description: Stock added successfully
 *       400:
 *         description: Validation failed or invalid item/supplier
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Item not found
 *       409:
 *         description: Reference number already exists
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  stockInBodyValidation,
  createStockIn
);

module.exports = router;