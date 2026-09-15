const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const itemIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "Item ID must be a valid positive integer."
    ),

  validateRequest,
];

const itemBodyValidation = [
  body("itemName")
    .trim()
    .notEmpty()
    .withMessage("Item name is required.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Item name must contain 2 to 150 characters."
    ),

  body("categoryId")
    .notEmpty()
    .withMessage(
      "Category ID is required."
    )
    .isInt({ min: 1 })
    .withMessage(
      "Category ID must be a valid positive integer."
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
    .withMessage(
      "Quantity is required."
    )
    .isInt({ min: 0 })
    .withMessage(
      "Quantity must be zero or a positive integer."
    ),

  body("reorderLevel")
    .notEmpty()
    .withMessage(
      "Reorder level is required."
    )
    .isInt({ min: 0 })
    .withMessage(
      "Reorder level must be zero or a positive integer."
    ),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required.")
    .isLength({
      min: 1,
      max: 50,
    })
    .withMessage(
      "Unit must contain 1 to 50 characters."
    ),

  body("status")
    .optional()
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
 * /api/items:
 *   get:
 *     summary: Get all items
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
  getAllItems
);


/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags:
 *       - Items
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
 *         description: Item retrieved successfully
 *       400:
 *         description: Invalid item ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  itemIdValidation,
  getItemById
);


/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *               - categoryId
 *               - supplierId
 *               - quantity
 *               - reorderLevel
 *               - unit
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: A4 Paper Pack
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *               supplierId:
 *                 type: integer
 *                 example: 2
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *               reorderLevel:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *               unit:
 *                 type: string
 *                 example: Pack
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Validation failed or category/supplier is invalid
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Item name already exists
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  itemBodyValidation,
  createItem
);


/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update an item
 *     tags:
 *       - Items
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
 *               - itemName
 *               - categoryId
 *               - supplierId
 *               - quantity
 *               - reorderLevel
 *               - unit
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: A4 Paper Pack
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *               supplierId:
 *                 type: integer
 *                 example: 2
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 70
 *               reorderLevel:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *               unit:
 *                 type: string
 *                 example: Pack
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Validation failed or invalid category/supplier
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Item not found
 *       409:
 *         description: Item name already exists
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  itemIdValidation,
  itemBodyValidation,
  updateItem
);


/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       400:
 *         description: Invalid item ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Item not found
 *       409:
 *         description: Item cannot be deleted because related records exist
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  itemIdValidation,
  deleteItem
);

module.exports = router;