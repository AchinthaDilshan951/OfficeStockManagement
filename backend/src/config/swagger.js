const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "Office Stock Management API",
    version: "1.0.0",
    description:
      "REST API documentation for the Office Stock Management System.",
  },

  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Something went wrong.",
          },
        },
      },
    },
  },

  tags: [
    {
      name: "Authentication",
      description:
        "User registration and login",
    },
    {
      name: "Users",
      description:
        "User management",
    },
    {
      name: "Categories",
      description:
        "Category management",
    },
    {
      name: "Suppliers",
      description:
        "Supplier management",
    },
    {
      name: "Items",
      description:
        "Item management",
    },
    {
      name: "Stock In",
      description:
        "Stock receiving operations",
    },
    {
      name: "Requests",
      description:
        "Employee stock requests",
    },
    {
      name: "Transactions",
      description:
        "Stock transaction history",
    },
    {
      name: "Reports",
      description:
        "Stock reports",
    },
    {
      name: "Logs",
      description:
        "System activity logs",
    },
  ],
};

const options = {
  swaggerDefinition,

  apis: [
    "./src/routes/*.js",
    "./src/app.js",
  ],
};

const swaggerSpec =
  swaggerJsdoc(options);

module.exports = swaggerSpec;