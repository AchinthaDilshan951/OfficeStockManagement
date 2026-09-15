const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const swaggerUi =
  require("swagger-ui-express");

const swaggerSpec =
  require("./config/swagger");

const authRoutes =
  require("./routes/authRoutes");

const testRoutes =
  require("./routes/testRoutes");

const categoryRoutes =
  require("./routes/categoryRoutes");

const supplierRoutes =
  require("./routes/supplierRoutes");

const itemRoutes =
  require("./routes/itemRoutes");

const stockInRoutes =
  require("./routes/stockInRoutes");

const requestRoutes =
  require("./routes/requestRoutes");

const transactionRoutes =
  require("./routes/transactionRoutes");

const userRoutes =
  require("./routes/userRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const logRoutes =
  require("./routes/logRoutes");

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ========================================
// SWAGGER DOCUMENTATION
// ========================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);


// ========================================
// HEALTH CHECK
// ========================================

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API status
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 */
app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Office Stock Management API is running.",
    });
  }
);


// ========================================
// ROUTES
// ========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/test",
  testRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/suppliers",
  supplierRoutes
);

app.use(
  "/api/items",
  itemRoutes
);

app.use(
  "/api/stock-in",
  stockInRoutes
);

app.use(
  "/api/requests",
  requestRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/logs",
  logRoutes
);


// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "API route not found.",
  });
});


// ========================================
// ERROR HANDLER
// ========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    if (
      error.type ===
      "entity.parse.failed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON request body.",
      });
    }

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A duplicate record already exists.",
      });
    }

    if (
      error.code ===
      "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This record cannot be deleted because it is used by another record.",
      });
    }

    if (
      error.code ===
      "ER_NO_REFERENCED_ROW_2"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The selected related record does not exist.",
      });
    }

    return res
      .status(
        error.status || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Internal server error.",
      });
  }
);

module.exports = app;