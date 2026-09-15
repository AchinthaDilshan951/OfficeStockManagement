require("dotenv").config();

const app = require("./src/app");

const {
  testDatabaseConnection,
} = require("./src/config/db");

const PORT =
  Number(process.env.PORT) || 5000;

const startServer = async () => {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );
  });
};

startServer();