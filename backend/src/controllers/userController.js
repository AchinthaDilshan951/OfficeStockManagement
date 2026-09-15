const { pool } = require("../config/db");

const {
  createLog,
  getClientIp,
} = require("../utils/logger");

const getAuthenticatedUserId = (req) =>
  Number(
    req.user?.userId ||
      req.user?.user_id ||
      req.user?.id
  ) || null;

const getAuthenticatedUserRole = (req) =>
  req.user?.role || null;

const canAccessUser = (
  req,
  targetUserId
) => {
  const actorId =
    getAuthenticatedUserId(req);

  const actorRole =
    getAuthenticatedUserRole(req);

  return (
    actorRole === "Admin" ||
    actorId ===
      Number(targetUserId)
  );
};


// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (
  req,
  res,
  next
) => {
  try {
    const [users] =
      await pool.execute(`
        SELECT
          user_id,
          user_code,
          full_name,
          username,
          email,
          phone,
          department,
          role,
          status,
          created_at,
          updated_at
        FROM users
        ORDER BY user_id DESC
      `);

    return res
      .status(200)
      .json({
        success: true,
        count: users.length,
        users,
      });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET USER BY ID
// ======================================================

const getUserById = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      Number(req.params.id);

    if (
      !canAccessUser(
        req,
        userId
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "You do not have permission to access this user account.",
        });
    }

    const [users] =
      await pool.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [
          userId,
        ]
      );

    if (
      users.length === 0
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        user: users[0],
      });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// UPDATE USER DETAILS
// ======================================================

const updateUser = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const actorId =
    getAuthenticatedUserId(req);

  let transactionStarted =
    false;

  try {
    const userId =
      Number(req.params.id);

    if (
      !canAccessUser(
        req,
        userId
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "You do not have permission to update this user account.",
        });
    }

    const {
      fullName,
      username,
      email,
      phone,
      department,
    } = req.body;

    await connection.beginTransaction();

    transactionStarted =
      true;

    const [existingUsers] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            role,
            status
          FROM users
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [
          userId,
        ]
      );

    if (
      existingUsers.length ===
      0
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId: actorId,
        action:
          "USER_UPDATE_FAILED",
        module:
          "Users",
        description:
          `User update failed because user ID ${userId} does not exist.`,
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found.",
        });
    }

    const existingUser =
      existingUsers[0];

    const cleanedUsername =
      username
        .trim()
        .toLowerCase();

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

    const cleanedPhone =
      phone.trim();

    const cleanedDepartment =
      department.trim();

    const cleanedFullName =
      fullName.trim();

    const [duplicates] =
      await connection.execute(
        `
          SELECT
            user_id
          FROM users
          WHERE (
            LOWER(username) =
              LOWER(?)
            OR LOWER(email) =
              LOWER(?)
          )
          AND user_id <> ?
          LIMIT 1
        `,
        [
          cleanedUsername,
          cleanedEmail,
          userId,
        ]
      );

    if (
      duplicates.length > 0
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId: actorId,
        action:
          "USER_UPDATE_FAILED",
        module:
          "Users",
        description:
          `User ${existingUser.user_code} could not be updated because the username or email already exists.`,
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(409)
        .json({
          success: false,
          message:
            "Username or email already exists.",
        });
    }

    await connection.execute(
      `
        UPDATE users
        SET
          full_name = ?,
          username = ?,
          email = ?,
          phone = ?,
          department = ?
        WHERE user_id = ?
      `,
      [
        cleanedFullName,
        cleanedUsername,
        cleanedEmail,
        cleanedPhone,
        cleanedDepartment,
        userId,
      ]
    );

    const [updatedUsers] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [
          userId,
        ]
      );

    await connection.commit();

    transactionStarted =
      false;

    const updatedUser =
      updatedUsers[0];

    await createLog({
      userId: actorId,
      action:
        "USER_UPDATE",
      module:
        "Users",
      description:
        `User ${updatedUser.user_code} - ${updatedUser.full_name} was updated.`,
      logLevel:
        "INFO",
      ipAddress:
        getClientIp(req),
    });

    return res
      .status(200)
      .json({
        success: true,
        message:
          "User updated successfully.",
        user:
          updatedUser,
      });
  } catch (error) {
    if (
      transactionStarted
    ) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback error.
      }
    }

    await createLog({
      userId: actorId,
      action:
        "USER_UPDATE_ERROR",
      module:
        "Users",
      description:
        `User update process failed: ${error.message}`,
      logLevel:
        "ERROR",
      ipAddress:
        getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};


// ======================================================
// UPDATE USER ROLE
// ======================================================

const updateUserRole = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const currentAdminId =
    getAuthenticatedUserId(req);

  let transactionStarted =
    false;

  try {
    const userId =
      Number(req.params.id);

    const {
      role,
    } = req.body;

    await connection.beginTransaction();

    transactionStarted =
      true;

    const [users] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            role
          FROM users
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [
          userId,
        ]
      );

    if (
      users.length === 0
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId:
          currentAdminId,
        action:
          "USER_ROLE_UPDATE_FAILED",
        module:
          "Users",
        description:
          `User role update failed because user ID ${userId} does not exist.`,
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found.",
        });
    }

    const existingUser =
      users[0];

    if (
      userId ===
        currentAdminId &&
      role !== "Admin"
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId:
          currentAdminId,
        action:
          "USER_ROLE_UPDATE_FAILED",
        module:
          "Users",
        description:
          "Admin attempted to remove their own Admin role.",
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(400)
        .json({
          success: false,
          message:
            "You cannot remove your own Admin role.",
        });
    }

    const previousRole =
      existingUser.role;

    await connection.execute(
      `
        UPDATE users
        SET role = ?
        WHERE user_id = ?
      `,
      [
        role,
        userId,
      ]
    );

    const [updatedUsers] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [
          userId,
        ]
      );

    await connection.commit();

    transactionStarted =
      false;

    const updatedUser =
      updatedUsers[0];

    await createLog({
      userId:
        currentAdminId,
      action:
        "USER_ROLE_CHANGE",
      module:
        "Users",
      description:
        `User ${updatedUser.user_code} - ${updatedUser.full_name} role changed from ${previousRole} to ${updatedUser.role}.`,
      logLevel:
        "INFO",
      ipAddress:
        getClientIp(req),
    });

    return res
      .status(200)
      .json({
        success: true,
        message:
          "User role updated successfully.",
        user:
          updatedUser,
      });
  } catch (error) {
    if (
      transactionStarted
    ) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback error.
      }
    }

    await createLog({
      userId:
        currentAdminId,
      action:
        "USER_ROLE_UPDATE_ERROR",
      module:
        "Users",
      description:
        `User role update process failed: ${error.message}`,
      logLevel:
        "ERROR",
      ipAddress:
        getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};


// ======================================================
// UPDATE USER STATUS
// ======================================================

const updateUserStatus = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const currentAdminId =
    getAuthenticatedUserId(req);

  let transactionStarted =
    false;

  try {
    const userId =
      Number(req.params.id);

    const {
      status,
    } = req.body;

    await connection.beginTransaction();

    transactionStarted =
      true;

    const [users] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            status
          FROM users
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [
          userId,
        ]
      );

    if (
      users.length === 0
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId:
          currentAdminId,
        action:
          "USER_STATUS_UPDATE_FAILED",
        module:
          "Users",
        description:
          `User status update failed because user ID ${userId} does not exist.`,
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found.",
        });
    }

    const existingUser =
      users[0];

    if (
      userId ===
        currentAdminId &&
      status ===
        "Inactive"
    ) {
      await connection.rollback();

      transactionStarted =
        false;

      await createLog({
        userId:
          currentAdminId,
        action:
          "USER_STATUS_UPDATE_FAILED",
        module:
          "Users",
        description:
          "Admin attempted to deactivate their own account.",
        logLevel:
          "WARNING",
        ipAddress:
          getClientIp(req),
      });

      return res
        .status(400)
        .json({
          success: false,
          message:
            "You cannot deactivate your own account.",
        });
    }

    const previousStatus =
      existingUser.status;

    await connection.execute(
      `
        UPDATE users
        SET status = ?
        WHERE user_id = ?
      `,
      [
        status,
        userId,
      ]
    );

    const [updatedUsers] =
      await connection.execute(
        `
          SELECT
            user_id,
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [
          userId,
        ]
      );

    await connection.commit();

    transactionStarted =
      false;

    const updatedUser =
      updatedUsers[0];

    await createLog({
      userId:
        currentAdminId,
      action:
        "USER_STATUS_CHANGE",
      module:
        "Users",
      description:
        `User ${updatedUser.user_code} - ${updatedUser.full_name} status changed from ${previousStatus} to ${updatedUser.status}.`,
      logLevel:
        "INFO",
      ipAddress:
        getClientIp(req),
    });

    return res
      .status(200)
      .json({
        success: true,
        message:
          "User status updated successfully.",
        user:
          updatedUser,
      });
  } catch (error) {
    if (
      transactionStarted
    ) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback error.
      }
    }

    await createLog({
      userId:
        currentAdminId,
      action:
        "USER_STATUS_UPDATE_ERROR",
      module:
        "Users",
      description:
        `User status update process failed: ${error.message}`,
      logLevel:
        "ERROR",
      ipAddress:
        getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};


module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
};