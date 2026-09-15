const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
} = require("../controllers/requestController");

const authenticateToken =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const validateRequest =
  require("../middleware/validateRequest");

const router = express.Router();

const requestIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "Request ID must be a valid positive integer."
    ),

  validateRequest,
];

const createRequestValidation = [
  body("itemId")
    .notEmpty()
    .withMessage(
      "Item ID is required."
    )
    .isInt({ min: 1 })
    .withMessage(
      "Item ID must be a valid positive integer."
    ),

  body("quantity")
    .notEmpty()
    .withMessage(
      "Quantity is required."
    )
    .isInt({ min: 1 })
    .withMessage(
      "Quantity must be greater than zero."
    ),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage(
      "Reason is required."
    )
    .isLength({
      min: 3,
      max: 1000,
    })
    .withMessage(
      "Reason must contain 3 to 1000 characters."
    ),

  body("requestDate")
    .optional({
      checkFalsy: true,
    })
    .isISO8601()
    .withMessage(
      "Request date must be a valid date."
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
      "Approved",
      "Rejected",
    ])
    .withMessage(
      "Status must be Approved or Rejected."
    ),

  validateRequest,
];


/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get stock requests
 *     description: Admin can view all requests. Normal users can view their own requests.
 *     tags:
 *       - Requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
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
  getAllRequests
);


/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get a request by ID
 *     tags:
 *       - Requests
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
 *         description: Request retrieved successfully
 *       400:
 *         description: Invalid request ID
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Request not found
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  requestIdValidation,
  getRequestById
);


/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new stock request
 *     tags:
 *       - Requests
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
 *               - quantity
 *               - reason
 *             properties:
 *               itemId:
 *                 type: integer
 *                 example: 2
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               reason:
 *                 type: string
 *                 example: Need paper for printing
 *               requestDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-06
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Validation failed or selected item is unavailable
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 *       409:
 *         description: A pending request already exists for this item
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "User"
  ),
  createRequestValidation,
  createRequest
);


/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Approve or reject a request
 *     description: Only Admin users can approve or reject pending requests.
 *     tags:
 *       - Requests
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
 *                   - Approved
 *                   - Rejected
 *                 example: Approved
 *     responses:
 *       200:
 *         description: Request status updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Request not found
 *       409:
 *         description: Request already reviewed or insufficient stock
 */
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("Admin"),
  requestIdValidation,
  statusValidation,
  updateRequestStatus
);

module.exports = router;