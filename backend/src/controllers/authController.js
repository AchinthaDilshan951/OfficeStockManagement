const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");

const {
  createLog,
  getClientIp,
} = require("../utils/logger");

/*
  Generate the next user code.

  Examples:
  USR-001
  USR-002
*/
const generateUserCode = async (
  connection
) => {
  const [rows] =
    await connection.execute(`
      SELECT
        COALESCE(
          MAX(
            CAST(
              SUBSTRING_INDEX(
                user_code,
                '-',
                -1
              ) AS UNSIGNED
            )
          ),
          0
        ) AS last_number
      FROM users
    `);

  const nextNumber =
    Number(
      rows[0].last_number
    ) + 1;

  return `USR-${String(
    nextNumber
  ).padStart(3, "0")}`;
};

/*
  Generate JWT token.
*/
const generateToken = (
  user
) => {
  return jwt.sign(
    {
      userId:
        user.user_id,

      username:
        user.username,

      role:
        user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn:
        process.env
          .JWT_EXPIRES_IN ||
        "1d",
    }
  );
};

/*
  Get authenticated user ID.

  Supports different possible
  auth middleware formats.
*/
const getAuthenticatedUserId = (
  req
) => {
  return Number(
    req.user?.userId ??
      req.user?.user_id ??
      req.user?.id ??
      0
  );
};

/*
  POST /api/auth/register
*/
const register = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  try {
    const {
      fullName,
      username,
      email,
      phone,
      department,
      password,
    } = req.body;

    const cleanedUsername =
      username
        .trim()
        .toLowerCase();

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

    await connection.beginTransaction();

    const [existingUsers] =
      await connection.execute(
        `
          SELECT
            user_id,
            username,
            email

          FROM users

          WHERE
            LOWER(username) =
            LOWER(?)

            OR LOWER(email) =
            LOWER(?)

          LIMIT 1
        `,
        [
          cleanedUsername,
          cleanedEmail,
        ]
      );

    if (
      existingUsers.length >
      0
    ) {
      await connection.rollback();

      return res
        .status(409)
        .json({
          success: false,

          message:
            "Username or email already exists.",
        });
    }

    const userCode =
      await generateUserCode(
        connection
      );

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    const [result] =
      await connection.execute(
        `
          INSERT INTO users (
            user_code,
            full_name,
            username,
            email,
            phone,
            department,
            password_hash,
            role,
            status
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'User',
            'Active'
          )
        `,
        [
          userCode,
          fullName.trim(),
          cleanedUsername,
          cleanedEmail,
          phone.trim(),
          department.trim(),
          passwordHash,
        ]
      );

    const [createdUsers] =
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
          result.insertId,
        ]
      );

    await connection.commit();

    const createdUser =
      createdUsers[0];

    await createLog({
      userId:
        createdUser.user_id,

      action:
        "REGISTER",

      module:
        "Authentication",

      description:
        `${createdUser.full_name} registered a new account.`,

      logLevel:
        "INFO",

      ipAddress:
        getClientIp(req),
    });

    return res
      .status(201)
      .json({
        success: true,

        message:
          "User registered successfully.",

        user:
          createdUser,
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback error.
    }

    await createLog({
      userId: null,

      action:
        "REGISTER_FAILED",

      module:
        "Authentication",

      description:
        `User registration failed: ${error.message}`,

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

/*
  POST /api/auth/login
*/
const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      username,
      password,
    } = req.body;

    const loginValue =
      username
        .trim()
        .toLowerCase();

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
            password_hash,
            role,
            status,
            created_at,
            updated_at

          FROM users

          WHERE
            LOWER(username) =
            LOWER(?)

            OR LOWER(email) =
            LOWER(?)

          LIMIT 1
        `,
        [
          loginValue,
          loginValue,
        ]
      );

    if (
      users.length === 0
    ) {
      await createLog({
        userId: null,

        action:
          "LOGIN_FAILED",

        module:
          "Authentication",

        description:
          `Login failed for username or email: ${loginValue}`,

        logLevel:
          "WARNING",

        ipAddress:
          getClientIp(req),
      });

      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid username or password.",
        });
    }

    const user =
      users[0];

    if (
      user.status !==
      "Active"
    ) {
      await createLog({
        userId:
          user.user_id,

        action:
          "LOGIN_FAILED",

        module:
          "Authentication",

        description:
          `${user.full_name} attempted to login using an inactive account.`,

        logLevel:
          "WARNING",

        ipAddress:
          getClientIp(req),
      });

      return res
        .status(403)
        .json({
          success: false,

          message:
            "Your account is inactive. Please contact the administrator.",
        });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (
      !passwordMatches
    ) {
      await createLog({
        userId:
          user.user_id,

        action:
          "LOGIN_FAILED",

        module:
          "Authentication",

        description:
          `Incorrect password entered for ${user.full_name}.`,

        logLevel:
          "WARNING",

        ipAddress:
          getClientIp(req),
      });

      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid username or password.",
        });
    }

    const token =
      generateToken(user);

    await createLog({
      userId:
        user.user_id,

      action:
        "LOGIN",

      module:
        "Authentication",

      description:
        `${user.full_name} logged into the system.`,

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
          "Login successful.",

        token,

        user: {
          user_id:
            user.user_id,

          user_code:
            user.user_code,

          full_name:
            user.full_name,

          username:
            user.username,

          email:
            user.email,

          phone:
            user.phone,

          department:
            user.department,

          role:
            user.role,

          status:
            user.status,

          created_at:
            user.created_at,

          updated_at:
            user.updated_at,
        },
      });
  } catch (error) {
    await createLog({
      userId: null,

      action:
        "LOGIN_ERROR",

      module:
        "Authentication",

      description:
        `Login process failed: ${error.message}`,

      logLevel:
        "ERROR",

      ipAddress:
        getClientIp(req),
    });

    next(error);
  }
};

/*
  PATCH /api/auth/change-password

  Authenticated user changes
  their own password.
*/
const changePassword = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      getAuthenticatedUserId(
        req
      );

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !Number.isInteger(
        userId
      ) ||
      userId <= 0
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Authentication required.",
        });
    }

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Current password and new password are required.",
        });
    }

    if (
      newPassword.length <
      6
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New password must contain at least 6 characters.",
        });
    }

    if (
      confirmPassword !==
      undefined &&
      newPassword !==
        confirmPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New passwords do not match.",
        });
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New password must be different from the current password.",
        });
    }

    const [users] =
      await pool.execute(
        `
          SELECT
            user_id,
            full_name,
            username,
            password_hash,
            status

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
            "User account not found.",
        });
    }

    const user =
      users[0];

    if (
      user.status !==
      "Active"
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "Inactive accounts cannot change passwords.",
        });
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

    if (
      !currentPasswordMatches
    ) {
      await createLog({
        userId:
          user.user_id,

        action:
          "PASSWORD_CHANGE_FAILED",

        module:
          "Authentication",

        description:
          `Incorrect current password entered while changing password for ${user.full_name}.`,

        logLevel:
          "WARNING",

        ipAddress:
          getClientIp(req),
      });

      return res
        .status(401)
        .json({
          success: false,

          message:
            "Current password is incorrect.",
        });
    }

    const sameAsOldPassword =
      await bcrypt.compare(
        newPassword,
        user.password_hash
      );

    if (
      sameAsOldPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New password must be different from the current password.",
        });
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        10
      );

    await pool.execute(
      `
        UPDATE users

        SET
          password_hash = ?,
          updated_at =
            CURRENT_TIMESTAMP

        WHERE user_id = ?
      `,
      [
        newPasswordHash,
        userId,
      ]
    );

    await createLog({
      userId:
        user.user_id,

      action:
        "PASSWORD_CHANGE",

      module:
        "Authentication",

      description:
        `${user.full_name} changed their account password.`,

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
          "Password changed successfully.",
      });
  } catch (error) {
    const userId =
      getAuthenticatedUserId(
        req
      );

    await createLog({
      userId:
        userId > 0
          ? userId
          : null,

      action:
        "PASSWORD_CHANGE_ERROR",

      module:
        "Authentication",

      description:
        `Password change failed: ${error.message}`,

      logLevel:
        "ERROR",

      ipAddress:
        getClientIp(req),
    });

    next(error);
  }
};

module.exports = {
  register,
  login,
  changePassword,
};