const { pool } = require("../config/db");

const getAllLogs = async (
  req,
  res,
  next
) => {
  try {
    const {
      action,
      module,
      logLevel,
      fromDate,
      toDate,
    } = req.query;

    let sql = `
      SELECT
        l.log_id,
        l.user_id,
        u.user_code,
        u.full_name AS user_name,
        u.username,
        u.role,
        l.action,
        l.module,
        l.description,
        l.log_level,
        l.ip_address,
        l.created_at
      FROM system_logs l
      LEFT JOIN users u
        ON l.user_id = u.user_id
      WHERE 1 = 1
    `;

    const values = [];

    if (action) {
      sql += `
        AND l.action = ?
      `;

      values.push(action);
    }

    if (module) {
      sql += `
        AND l.module = ?
      `;

      values.push(module);
    }

    if (logLevel) {
      sql += `
        AND l.log_level = ?
      `;

      values.push(logLevel);
    }

    if (fromDate) {
      sql += `
        AND DATE(l.created_at) >= ?
      `;

      values.push(fromDate);
    }

    if (toDate) {
      sql += `
        AND DATE(l.created_at) <= ?
      `;

      values.push(toDate);
    }

    sql += `
      ORDER BY
        l.created_at DESC,
        l.log_id DESC
    `;

    const [logs] =
      await pool.execute(
        sql,
        values
      );

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

const getLogById = async (
  req,
  res,
  next
) => {
  try {
    const logId =
      Number(req.params.id);

    const [logs] =
      await pool.execute(
        `
          SELECT
            l.log_id,
            l.user_id,
            u.user_code,
            u.full_name AS user_name,
            u.username,
            u.role,
            l.action,
            l.module,
            l.description,
            l.log_level,
            l.ip_address,
            l.created_at
          FROM system_logs l
          LEFT JOIN users u
            ON l.user_id = u.user_id
          WHERE l.log_id = ?
          LIMIT 1
        `,
        [logId]
      );

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Log record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      log: logs[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLogs,
  getLogById,
};