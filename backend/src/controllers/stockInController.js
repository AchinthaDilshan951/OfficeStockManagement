const { pool } = require("../config/db");

const {
  createLog,
  getClientIp,
} = require("../utils/logger");

const getAllStockInRecords = async (
  req,
  res,
  next
) => {
  try {
    const [records] = await pool.execute(`
      SELECT
        si.stock_in_id,
        si.stock_in_code,
        si.reference_number,
        si.item_id,
        i.item_code,
        i.item_name,
        i.unit,
        si.supplier_id,
        s.supplier_code,
        s.supplier_name,
        si.quantity,
        si.received_date,
        si.received_by,
        u.full_name AS received_by_name,
        si.created_at
      FROM stock_in si
      INNER JOIN items i
        ON si.item_id = i.item_id
      INNER JOIN suppliers s
        ON si.supplier_id = s.supplier_id
      INNER JOIN users u
        ON si.received_by = u.user_id
      ORDER BY si.stock_in_id DESC
    `);

    return res.status(200).json({
      success: true,
      count: records.length,
      stockInRecords: records,
    });
  } catch (error) {
    next(error);
  }
};

const getStockInById = async (
  req,
  res,
  next
) => {
  try {
    const stockInId = Number(req.params.id);

    const [records] = await pool.execute(
      `
        SELECT
          si.stock_in_id,
          si.stock_in_code,
          si.reference_number,
          si.item_id,
          i.item_code,
          i.item_name,
          i.unit,
          si.supplier_id,
          s.supplier_code,
          s.supplier_name,
          si.quantity,
          si.received_date,
          si.received_by,
          u.full_name AS received_by_name,
          si.created_at
        FROM stock_in si
        INNER JOIN items i
          ON si.item_id = i.item_id
        INNER JOIN suppliers s
          ON si.supplier_id = s.supplier_id
        INNER JOIN users u
          ON si.received_by = u.user_id
        WHERE si.stock_in_id = ?
        LIMIT 1
      `,
      [stockInId]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock-in record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      stockInRecord: records[0],
    });
  } catch (error) {
    next(error);
  }
};

const generateStockInCode = async (
  connection
) => {
  const [rows] = await connection.execute(`
    SELECT
      COALESCE(
        MAX(
          CAST(
            SUBSTRING_INDEX(
              stock_in_code,
              '-',
              -1
            ) AS UNSIGNED
          )
        ),
        0
      ) AS last_number
    FROM stock_in
  `);

  const nextNumber =
    Number(rows[0].last_number) + 1;

  return `STI-${String(nextNumber).padStart(
    3,
    "0"
  )}`;
};

const generateTransactionCode = async (
  connection
) => {
  const [rows] = await connection.execute(`
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
    Number(rows[0].last_number) + 1;

  return `TRN-${String(nextNumber).padStart(
    3,
    "0"
  )}`;
};

const createStockIn = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  let receivedBy = null;

  try {
    const {
      itemId,
      supplierId,
      quantity,
      referenceNumber,
      receivedDate,
      note,
    } = req.body;

    receivedBy = Number(
      req.user?.userId ||
        req.user?.user_id ||
        req.user?.id
    );

    if (
      !receivedBy ||
      Number.isNaN(receivedBy)
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user information is invalid.",
      });
    }

    await connection.beginTransaction();

    const [items] =
      await connection.execute(
        `
          SELECT
            item_id,
            item_code,
            item_name,
            supplier_id,
            quantity,
            unit
          FROM items
          WHERE item_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [Number(itemId)]
      );

    if (items.length === 0) {
      await connection.rollback();

      await createLog({
        userId: receivedBy,
        action: "STOCK_IN_FAILED",
        module: "Stock Management",
        description:
          `Stock-in failed because item ID ${itemId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message:
          "Selected item does not exist.",
      });
    }

    const [suppliers] =
      await connection.execute(
        `
          SELECT
            supplier_id,
            supplier_name
          FROM suppliers
          WHERE supplier_id = ?
            AND status = 'Active'
          LIMIT 1
        `,
        [Number(supplierId)]
      );

    if (suppliers.length === 0) {
      await connection.rollback();

      await createLog({
        userId: receivedBy,
        action: "STOCK_IN_FAILED",
        module: "Stock Management",
        description:
          `Stock-in failed because supplier ID ${supplierId} does not exist or is inactive.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(400).json({
        success: false,
        message:
          "Selected supplier does not exist or is inactive.",
      });
    }

    const [duplicateReferences] =
      await connection.execute(
        `
          SELECT stock_in_id
          FROM stock_in
          WHERE reference_number = ?
          LIMIT 1
        `,
        [referenceNumber.trim()]
      );

    if (
      duplicateReferences.length > 0
    ) {
      await connection.rollback();

      await createLog({
        userId: receivedBy,
        action: "STOCK_IN_FAILED",
        module: "Stock Management",
        description:
          `Stock-in failed because reference number ${referenceNumber.trim()} already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Reference number already exists.",
      });
    }

    const stockInCode =
      await generateStockInCode(
        connection
      );

    const transactionCode =
      await generateTransactionCode(
        connection
      );

    const stockInQuantity =
      Number(quantity);

    const stockInDate =
      receivedDate ||
      new Date()
        .toISOString()
        .slice(0, 10);

    const [stockInResult] =
      await connection.execute(
        `
          INSERT INTO stock_in (
            stock_in_code,
            reference_number,
            item_id,
            supplier_id,
            quantity,
            received_date,
            received_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          stockInCode,
          referenceNumber.trim(),
          Number(itemId),
          Number(supplierId),
          stockInQuantity,
          stockInDate,
          receivedBy,
        ]
      );

    await connection.execute(
      `
        UPDATE items
        SET
          quantity = quantity + ?,
          status = 'Active'
        WHERE item_id = ?
      `,
      [
        stockInQuantity,
        Number(itemId),
      ]
    );

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
          'Stock In',
          ?,
          ?,
          ?,
          ?,
          NULL,
          ?,
          ?,
          ?
        )
      `,
      [
        transactionCode,
        Number(itemId),
        stockInQuantity,
        referenceNumber.trim(),
        Number(supplierId),
        stockInDate,
        receivedBy,
        note?.trim() || null,
      ]
    );

    const [createdRecords] =
      await connection.execute(
        `
          SELECT
            si.stock_in_id,
            si.stock_in_code,
            si.reference_number,
            si.item_id,
            i.item_code,
            i.item_name,
            i.unit,
            si.supplier_id,
            s.supplier_code,
            s.supplier_name,
            si.quantity,
            i.quantity AS current_item_quantity,
            si.received_date,
            si.received_by,
            u.full_name AS received_by_name,
            si.created_at
          FROM stock_in si
          INNER JOIN items i
            ON si.item_id = i.item_id
          INNER JOIN suppliers s
            ON si.supplier_id =
               s.supplier_id
          INNER JOIN users u
            ON si.received_by =
               u.user_id
          WHERE si.stock_in_id = ?
          LIMIT 1
        `,
        [stockInResult.insertId]
      );

    await connection.commit();

    await createLog({
      userId: receivedBy,
      action: "STOCK_IN",
      module: "Stock Management",
      description:
        `${stockInQuantity} ${createdRecords[0].unit} of ${createdRecords[0].item_name} added to stock. Reference: ${referenceNumber.trim()}.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message:
        "Stock added successfully.",
      stockInRecord:
        createdRecords[0],
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId: receivedBy,
      action: "STOCK_IN_ERROR",
      module: "Stock Management",
      description:
        `Stock-in process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllStockInRecords,
  getStockInById,
  createStockIn,
};