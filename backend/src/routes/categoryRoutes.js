const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const categoryIdValidation = [
  param("id")
    .isInt({
      min: 1,
    })
    .withMessage(
      "Category ID must be a valid positive integer."
    ),

  validateRequest,
];

const categoryBodyValidation = [
  body("categoryName")
    .trim()
    .notEmpty()
    .withMessage(
      "Category name is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Category name must contain 2 to 100 characters."
    ),

  body("description")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description cannot exceed 1000 characters."
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
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
  getAllCategories
);


/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags:
 *       - Categories
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
 *         description: Category retrieved successfully
 *       400:
 *         description: Invalid category ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Category not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  categoryIdValidation,
  getCategoryById
);


/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryName
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: Stationery
 *               description:
 *                 type: string
 *                 example: Office stationery items
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Category name already exists
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  categoryBodyValidation,
  createCategory
);


/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags:
 *       - Categories
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
 *               - categoryName
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: Stationery
 *               description:
 *                 type: string
 *                 example: Office stationery and printing items
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation failed or invalid category ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  categoryIdValidation,
  categoryBodyValidation,
  updateCategory
);


/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags:
 *       - Categories
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
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid category ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category cannot be deleted because it is used by items
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  categoryIdValidation,
  deleteCategory
);

module.exports = router;