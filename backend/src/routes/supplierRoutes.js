const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const supplierIdValidation = [
  param("id")
    .isInt({
      min: 1,
    })
    .withMessage(
      "Supplier ID must be a valid positive integer."
    ),

  validateRequest,
];

const supplierBodyValidation = [
  body("supplierName")
    .trim()
    .notEmpty()
    .withMessage(
      "Supplier name is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Supplier name must contain 2 to 100 characters."
    ),

  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage(
      "Contact person is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Contact person must contain 2 to 100 characters."
    ),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage(
      "Phone number is required."
    )
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage(
      "Enter a valid phone number."
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage(
      "Email address is required."
    )
    .isEmail()
    .withMessage(
      "Enter a valid email address."
    ),

  body("address")
    .trim()
    .notEmpty()
    .withMessage(
      "Address is required."
    )
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Address cannot exceed 1000 characters."
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
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
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
  getAllSuppliers
);


/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get a supplier by ID
 *     tags:
 *       - Suppliers
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
 *         description: Supplier retrieved successfully
 *       400:
 *         description: Invalid supplier ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  supplierIdValidation,
  getSupplierById
);


/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierName
 *               - contactPerson
 *               - phone
 *               - email
 *               - address
 *             properties:
 *               supplierName:
 *                 type: string
 *                 example: ABC Suppliers
 *               contactPerson:
 *                 type: string
 *                 example: Nimal Perera
 *               phone:
 *                 type: string
 *                 example: "0771234567"
 *               email:
 *                 type: string
 *                 example: abc@example.com
 *               address:
 *                 type: string
 *                 example: Colombo
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Supplier name or email already exists
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  supplierBodyValidation,
  createSupplier
);


/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update a supplier
 *     tags:
 *       - Suppliers
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
 *               - supplierName
 *               - contactPerson
 *               - phone
 *               - email
 *               - address
 *             properties:
 *               supplierName:
 *                 type: string
 *                 example: ABC Suppliers
 *               contactPerson:
 *                 type: string
 *                 example: Nimal Perera
 *               phone:
 *                 type: string
 *                 example: "0777654321"
 *               email:
 *                 type: string
 *                 example: abc@example.com
 *               address:
 *                 type: string
 *                 example: Colombo 05
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       400:
 *         description: Validation failed or invalid supplier ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Supplier not found
 *       409:
 *         description: Supplier name or email already exists
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  supplierIdValidation,
  supplierBodyValidation,
  updateSupplier
);


/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags:
 *       - Suppliers
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
 *         description: Supplier deleted successfully
 *       400:
 *         description: Invalid supplier ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Supplier not found
 *       409:
 *         description: Supplier cannot be deleted because it is used by items
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  supplierIdValidation,
  deleteSupplier
);

module.exports = router;