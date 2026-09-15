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
  );

const getAuthenticatedUserRole = (req) =>
  req.user?.role;

const generateRequestCode = async (
  connection
) => {
  const [rows] =
    await connection.execute(`
      SELECT
        COALESCE(
          MAX(
            CAST(
              SUBSTRING_INDEX(
                request_code,
                '-',
                -1
              ) AS UNSIGNED
            )
          ),
          0
        ) AS last_number
      FROM requests
    `);

  const nextNumber =
    Number(
      rows[0].last_number
    ) + 1;

  return `REQ-${String(
    nextNumber
  ).padStart(3, "0")}`;
};

const generateTransactionCode =
  async (connection) => {
    const [rows] =
      await connection.execute(`
        SELECT
          COALESCE(
            MAX(
              CAST(
                SUBSTRING_INDEX(
                  transaction_code,
                  '-',
                  -1
                ) AS UNSIGNED
              )
            ),
            0
          ) AS last_number
        FROM transactions
      `);

    const nextNumber =
      Number(
        rows[0].last_number
      ) + 1;

    return `TRN-${String(
      nextNumber
    ).padStart(3, "0")}`;
  };

/*
  GET /api/requests
*/
const getAllRequests = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const role =
      getAuthenticatedUserRole(req);

    let sql = `
      SELECT
        r.request_id,
        r.request_code,

        r.user_id,
        requester.user_code,
        requester.username,
        requester.full_name
          AS requested_by_name,
        requester.department,

        r.item_id,
        i.item_code,
        i.item_name,
        i.quantity
          AS available_quantity,
        i.unit,

        c.category_id,
        c.category_name,

        r.quantity,
        r.reason,
        r.request_date,
        r.status,

        r.reviewed_by,
        reviewer.full_name
          AS reviewed_by_name,
        r.reviewed_at,

        r.created_at

      FROM requests r

      INNER JOIN users requester
        ON r.user_id =
           requester.user_id

      INNER JOIN items i
        ON r.item_id =
           i.item_id

      LEFT JOIN categories c
        ON i.category_id =
           c.category_id

      LEFT JOIN users reviewer
        ON r.reviewed_by =
           reviewer.user_id
    `;

    const values = [];

    if (
      role !== "Admin"
    ) {
      sql += `
        WHERE r.user_id = ?
      `;

      values.push(
        userId
      );
    }

    sql += `
      ORDER BY
        r.request_id DESC
    `;

    const [requests] =
      await pool.execute(
        sql,
        values
      );

    return res
      .status(200)
      .json({
        success: true,
        count:
          requests.length,
        requests,
      });
  } catch (error) {
    next(error);
  }
};

/*
  GET /api/requests/:id
*/
const getRequestById = async (
  req,
  res,
  next
) => {
  try {
    const requestId =
      Number(
        req.params.id
      );

    const userId =
      getAuthenticatedUserId(
        req
      );

    const role =
      getAuthenticatedUserRole(
        req
      );

    const [requests] =
      await pool.execute(
        `
          SELECT
            r.request_id,
            r.request_code,

            r.user_id,
            requester.user_code,
            requester.username,
            requester.full_name
              AS requested_by_name,
            requester.department,

            r.item_id,
            i.item_code,
            i.item_name,
            i.quantity
              AS available_quantity,
            i.unit,

            c.category_id,
            c.category_name,

            r.quantity,
            r.reason,
            r.request_date,
            r.status,

            r.reviewed_by,
            reviewer.full_name
              AS reviewed_by_name,
            r.reviewed_at,

            r.created_at

          FROM requests r

          INNER JOIN users requester
            ON r.user_id =
               requester.user_id

          INNER JOIN items i
            ON r.item_id =
               i.item_id

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          LEFT JOIN users reviewer
            ON r.reviewed_by =
               reviewer.user_id

          WHERE
            r.request_id = ?

          LIMIT 1
        `,
        [
          requestId,
        ]
      );

    if (
      requests.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Request not found.",
        });
    }

    const request =
      requests[0];

    if (
      role !== "Admin" &&
      Number(
        request.user_id
      ) !== userId
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "You do not have permission to view this request.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        request,
      });
  } catch (error) {
    next(error);
  }
};

/*
  POST /api/requests
*/
const createRequest = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  let userId = null;

  try {
    userId =
      getAuthenticatedUserId(
        req
      );

    const {
      itemId,
      quantity,
      reason,
      requestDate,
    } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authenticated user information is invalid.",
        });
    }

    await connection.beginTransaction();

    const [users] =
      await connection.execute(
        `
          SELECT
            user_id,
            full_name,
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
      users.length === 0 ||
      users[0].status !==
        "Active"
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "REQUEST_CREATE_FAILED",
        module:
          "Requests",
        description:
          "Request creation failed because the user account does not exist or is inactive.",
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
            "User account does not exist or is inactive.",
        });
    }

    const [items] =
      await connection.execute(
        `
          SELECT
            i.item_id,
            i.item_name,
            i.quantity,
            i.unit,
            i.status,
            i.category_id,
            c.category_name

          FROM items i

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          WHERE
            i.item_id = ?

          LIMIT 1
        `,
        [
          Number(itemId),
        ]
      );

    if (
      items.length === 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "REQUEST_CREATE_FAILED",
        module:
          "Requests",
        description:
          `Request creation failed because item ID ${itemId} does not exist.`,
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
            "Selected item does not exist.",
        });
    }

    if (
      Number(
        items[0].quantity
      ) <= 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "REQUEST_CREATE_FAILED",
        module:
          "Requests",
        description:
          `Request creation failed because ${items[0].item_name} is out of stock.`,
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
            "Selected item is currently out of stock.",
        });
    }

    if (
      Number(quantity) >
      Number(
        items[0].quantity
      )
    ) {
      await connection.rollback();

      return res
        .status(400)
        .json({
          success: false,
          message:
            `Only ${items[0].quantity} items are currently available.`,
        });
    }

    const [existingPending] =
      await connection.execute(
        `
          SELECT
            request_id

          FROM requests

          WHERE
            user_id = ?
            AND item_id = ?
            AND status =
              'Pending'

          LIMIT 1
        `,
        [
          userId,
          Number(itemId),
        ]
      );

    if (
      existingPending.length >
      0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "REQUEST_CREATE_FAILED",
        module:
          "Requests",
        description:
          `A pending request already exists for ${items[0].item_name}.`,
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
            "You already have a pending request for this item.",
        });
    }

    const requestCode =
      await generateRequestCode(
        connection
      );

    const finalRequestDate =
      requestDate ||
      new Date()
        .toISOString()
        .slice(0, 10);

    const [result] =
      await connection.execute(
        `
          INSERT INTO requests (
            request_code,
            user_id,
            item_id,
            quantity,
            reason,
            request_date,
            status,
            reviewed_by,
            reviewed_at
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'Pending',
            NULL,
            NULL
          )
        `,
        [
          requestCode,
          userId,
          Number(itemId),
          Number(quantity),
          reason.trim(),
          finalRequestDate,
        ]
      );

    const [createdRequests] =
      await connection.execute(
        `
          SELECT
            r.request_id,
            r.request_code,

            r.user_id,
            u.user_code,
            u.username,
            u.full_name
              AS requested_by_name,

            r.item_id,
            i.item_code,
            i.item_name,
            i.quantity
              AS available_quantity,
            i.unit,

            c.category_id,
            c.category_name,

            r.quantity,
            r.reason,
            r.request_date,
            r.status,

            r.reviewed_by,
            r.reviewed_at,

            r.created_at

          FROM requests r

          INNER JOIN users u
            ON r.user_id =
               u.user_id

          INNER JOIN items i
            ON r.item_id =
               i.item_id

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          WHERE
            r.request_id = ?

          LIMIT 1
        `,
        [
          result.insertId,
        ]
      );

    await connection.commit();

    const createdRequest =
      createdRequests[0];

    await createLog({
      userId,
      action:
        "REQUEST_CREATE",
      module:
        "Requests",
      description:
        `${createdRequest.requested_by_name} requested ${createdRequest.quantity} ${createdRequest.unit} of ${createdRequest.item_name}. Request code: ${createdRequest.request_code}.`,
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
          "Request created successfully.",
        request:
          createdRequest,
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback error.
    }

    await createLog({
      userId,
      action:
        "REQUEST_CREATE_ERROR",
      module:
        "Requests",
      description:
        `Request creation process failed: ${error.message}`,
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
  PATCH /api/requests/:id/status
*/
const updateRequestStatus = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  let adminId = null;

  try {
    const requestId =
      Number(
        req.params.id
      );

    adminId =
      getAuthenticatedUserId(
        req
      );

    const {
      status,
    } = req.body;

    await connection.beginTransaction();

    const [requests] =
      await connection.execute(
        `
          SELECT
            r.request_id,
            r.request_code,
            r.user_id,
            r.item_id,
            r.quantity,
            r.status,

            requester.full_name
              AS requested_by_name,

            i.item_name,
            i.unit,
            i.quantity
              AS available_quantity,
            i.reorder_level,

            c.category_id,
            c.category_name

          FROM requests r

          INNER JOIN items i
            ON r.item_id =
               i.item_id

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          INNER JOIN users requester
            ON r.user_id =
               requester.user_id

          WHERE
            r.request_id = ?

          LIMIT 1

          FOR UPDATE
        `,
        [
          requestId,
        ]
      );

    if (
      requests.length ===
      0
    ) {
      await connection.rollback();

      await createLog({
        userId:
          adminId,
        action:
          "REQUEST_REVIEW_FAILED",
        module:
          "Requests",
        description:
          `Request review failed because request ID ${requestId} does not exist.`,
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
            "Request not found.",
        });
    }

    const request =
      requests[0];

    if (
      request.status !==
      "Pending"
    ) {
      await connection.rollback();

      await createLog({
        userId:
          adminId,
        action:
          "REQUEST_REVIEW_FAILED",
        module:
          "Requests",
        description:
          `Request ${request.request_code} could not be reviewed because its current status is ${request.status}.`,
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
            "Only pending requests can be reviewed.",
        });
    }

    if (
      status ===
      "Approved"
    ) {
      if (
        Number(
          request.available_quantity
        ) <
        Number(
          request.quantity
        )
      ) {
        await connection.rollback();

        await createLog({
          userId:
            adminId,
          action:
            "REQUEST_APPROVAL_FAILED",
          module:
            "Requests",
          description:
            `Request ${request.request_code} could not be approved because available stock for ${request.item_name} is ${request.available_quantity}, but ${request.quantity} was requested.`,
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
              "Insufficient stock to approve this request.",
            availableQuantity:
              request.available_quantity,
            requestedQuantity:
              request.quantity,
          });
      }

      const newQuantity =
        Number(
          request.available_quantity
        ) -
        Number(
          request.quantity
        );

      let itemStatus =
        "Active";

      if (
        newQuantity ===
        0
      ) {
        itemStatus =
          "Out of Stock";
      } else if (
        newQuantity <=
        Number(
          request.reorder_level
        )
      ) {
        itemStatus =
          "Low Stock";
      }

      await connection.execute(
        `
          UPDATE items

          SET
            quantity = ?,
            status = ?

          WHERE
            item_id = ?
        `,
        [
          newQuantity,
          itemStatus,
          request.item_id,
        ]
      );

      const transactionCode =
        await generateTransactionCode(
          connection
        );

      const transactionDate =
        new Date()
          .toISOString()
          .slice(0, 10);

      await connection.execute(
        `
          INSERT INTO transactions (
            transaction_code,
            transaction_type,
            item_id,
            quantity,
            reference_number,
            supplier_id,
            employee_id,
            transaction_date,
            handled_by,
            note
          )

          VALUES (
            ?,
            'Stock Out',
            ?,
            ?,
            ?,
            NULL,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          transactionCode,
          request.item_id,
          request.quantity,
          request.request_code,
          request.user_id,
          transactionDate,
          adminId,
          `Approved item request ${request.request_code}`,
        ]
      );
    }

    await connection.execute(
      `
        UPDATE requests

        SET
          status = ?,
          reviewed_by = ?,
          reviewed_at = NOW()

        WHERE
          request_id = ?
      `,
      [
        status,
        adminId,
        requestId,
      ]
    );

    const [updatedRequests] =
      await connection.execute(
        `
          SELECT
            r.request_id,
            r.request_code,

            r.user_id,

            requester.user_code,
            requester.username,
            requester.full_name
              AS requested_by_name,

            r.item_id,

            i.item_code,
            i.item_name,
            i.unit,
            i.quantity
              AS current_item_quantity,
            i.status
              AS item_status,

            c.category_id,
            c.category_name,

            r.quantity,
            r.reason,
            r.request_date,
            r.status,

            r.reviewed_by,

            reviewer.full_name
              AS reviewed_by_name,

            r.reviewed_at,
            r.created_at

          FROM requests r

          INNER JOIN users requester
            ON r.user_id =
               requester.user_id

          INNER JOIN items i
            ON r.item_id =
               i.item_id

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          LEFT JOIN users reviewer
            ON r.reviewed_by =
               reviewer.user_id

          WHERE
            r.request_id = ?

          LIMIT 1
        `,
        [
          requestId,
        ]
      );

    await connection.commit();

    const updatedRequest =
      updatedRequests[0];

    if (
      status ===
      "Approved"
    ) {
      await createLog({
        userId:
          adminId,
        action:
          "REQUEST_APPROVE",
        module:
          "Requests",
        description:
          `Request ${updatedRequest.request_code} for ${updatedRequest.quantity} ${updatedRequest.unit} of ${updatedRequest.item_name} was approved. Remaining quantity: ${updatedRequest.current_item_quantity}.`,
        logLevel:
          "INFO",
        ipAddress:
          getClientIp(req),
      });
    } else {
      await createLog({
        userId:
          adminId,
        action:
          "REQUEST_REJECT",
        module:
          "Requests",
        description:
          `Request ${updatedRequest.request_code} for ${updatedRequest.quantity} ${updatedRequest.unit} of ${updatedRequest.item_name} was rejected.`,
        logLevel:
          "INFO",
        ipAddress:
          getClientIp(req),
      });
    }

    return res
      .status(200)
      .json({
        success: true,

        message:
          status ===
          "Approved"
            ? "Request approved successfully."
            : "Request rejected successfully.",

        request:
          updatedRequest,
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback error.
    }

    await createLog({
      userId:
        adminId,
      action:
        "REQUEST_REVIEW_ERROR",
      module:
        "Requests",
      description:
        `Request review process failed: ${error.message}`,
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
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
};