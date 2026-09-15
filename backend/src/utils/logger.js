const { pool } = require("../config/db");

const createLog = async ({
  userId = null,
  action,
  module,
  description,
  logLevel = "INFO",
  ipAddress = null,
}) => {
  try {
    await pool.execute(
      `
        INSERT INTO system_logs (
          user_id,
          action,
          module,
          description,
          log_level,
          ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        action,
        module,
        description,
        logLevel,
        ipAddress,
      ]
    );
  } catch (error) {
    console.error(
      "Failed to save system log:",
      error.message
    );
  }
};

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]
      ?.split(",")[0]
      ?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
};

module.exports = {
  createLog,
  getClientIp,
};