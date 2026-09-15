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

const getAllItems = async (req, res, next) => {
  try {
    const [items] = await pool.execute(`
      SELECT
        i.item_id,
        i.item_code,
        i.item_name,
        i.category_id,
        c.category_name,
        i.supplier_id,
        s.supplier_name,
        i.quantity,
        i.reorder_level,
        i.unit,
        i.status,
        i.created_at,
        i.updated_at
      FROM items i
      LEFT JOIN categories c
        ON i.category_id = c.category_id
      LEFT JOIN suppliers s
        ON i.supplier_id = s.supplier_id
      ORDER BY i.item_id DESC
    `);

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);

    const [items] = await pool.execute(
      `
        SELECT
          i.item_id,
          i.item_code,
          i.item_name,
          i.category_id,
          c.category_name,
          i.supplier_id,
          s.supplier_name,
          i.quantity,
          i.reorder_level,
          i.unit,
          i.status,
          i.created_at,
          i.updated_at
        FROM items i
        LEFT JOIN categories c
          ON i.category_id = c.category_id
        LEFT JOIN suppliers s
          ON i.supplier_id = s.supplier_id
        WHERE i.item_id = ?
        LIMIT 1
      `,
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      item: items[0],
    });
  } catch (error) {
    next(error);
  }
};

const generateItemCode = async (connection) => {
  const [rows] = await connection.execute(`
    SELECT
      COALESCE(
        MAX(
          CAST(
            SUBSTRING_INDEX(
              item_code,
              '-',
              -1
            ) AS UNSIGNED
          )
        ),
        0
      ) AS last_number
    FROM items
  `);

  const nextNumber =
    Number(rows[0].last_number) + 1;

  return `ITM-${String(nextNumber).padStart(
    3,
    "0"
  )}`;
};

const validateCategoryAndSupplier = async (
  connection,
  categoryId,
  supplierId
) => {
  const [categories] =
    await connection.execute(
      `
        SELECT
          category_id,
          category_code,
          category_name
        FROM categories
        WHERE category_id = ?
          AND status = 'Active'
        LIMIT 1
      `,
      [categoryId]
    );

  if (categories.length === 0) {
    return {
      valid: false,
      status: 400,
      message:
        "Selected category does not exist or is inactive.",
    };
  }

  const [suppliers] =
    await connection.execute(
      `
        SELECT
          supplier_id,
          supplier_code,
          supplier_name
        FROM suppliers
        WHERE supplier_id = ?
          AND status = 'Active'
        LIMIT 1
      `,
      [supplierId]
    );

  if (suppliers.length === 0) {
    return {
      valid: false,
      status: 400,
      message:
        "Selected supplier does not exist or is inactive.",
    };
  }

  return {
    valid: true,
    category: categories[0],
    supplier: suppliers[0],
  };
};

const determineItemStatus = (
  quantity,
  reorderLevel,
  requestedStatus
) => {
  const numericQuantity = Number(quantity);
  const numericReorderLevel =
    Number(reorderLevel);

  if (numericQuantity === 0) {
    return "Out of Stock";
  }

  if (
    numericQuantity <=
    numericReorderLevel
  ) {
    return "Low Stock";
  }

  return requestedStatus || "Active";
};

const createItem = async (req, res, next) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const {
      itemName,
      categoryId,
      supplierId,
      quantity,
      reorderLevel,
      unit,
      status,
    } = req.body;

    const cleanedName =
      itemName.trim();

    const cleanedUnit =
      unit.trim();

    const numericCategoryId =
      Number(categoryId);

    const numericSupplierId =
      Number(supplierId);

    const numericQuantity =
      Number(quantity);

    const numericReorderLevel =
      Number(reorderLevel);

    await connection.beginTransaction();

    const referenceValidation =
      await validateCategoryAndSupplier(
        connection,
        numericCategoryId,
        numericSupplierId
      );

    if (!referenceValidation.valid) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_CREATE_FAILED",
        module: "Items",
        description:
          `Item creation failed for "${cleanedName}". ${referenceValidation.message}`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res
        .status(referenceValidation.status)
        .json({
          success: false,
          message:
            referenceValidation.message,
        });
    }

    const [existingItems] =
      await connection.execute(
        `
          SELECT item_id
          FROM items
          WHERE LOWER(item_name) =
                LOWER(?)
          LIMIT 1
        `,
        [cleanedName]
      );

    if (existingItems.length > 0) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_CREATE_FAILED",
        module: "Items",
        description:
          `Item creation failed because "${cleanedName}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Item name already exists.",
      });
    }

    const itemCode =
      await generateItemCode(connection);

    const finalStatus =
      determineItemStatus(
        numericQuantity,
        numericReorderLevel,
        status
      );

    const [result] =
      await connection.execute(
        `
          INSERT INTO items (
            item_code,
            item_name,
            category_id,
            supplier_id,
            quantity,
            reorder_level,
            unit,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          itemCode,
          cleanedName,
          numericCategoryId,
          numericSupplierId,
          numericQuantity,
          numericReorderLevel,
          cleanedUnit,
          finalStatus,
        ]
      );

    const [createdItems] =
      await connection.execute(
        `
          SELECT
            i.item_id,
            i.item_code,
            i.item_name,
            i.category_id,
            c.category_name,
            i.supplier_id,
            s.supplier_name,
            i.quantity,
            i.reorder_level,
            i.unit,
            i.status,
            i.created_at,
            i.updated_at
          FROM items i
          LEFT JOIN categories c
            ON i.category_id =
               c.category_id
          LEFT JOIN suppliers s
            ON i.supplier_id =
               s.supplier_id
          WHERE i.item_id = ?
          LIMIT 1
        `,
        [result.insertId]
      );

    await connection.commit();

    const createdItem =
      createdItems[0];

    await createLog({
      userId,
      action: "ITEM_CREATE",
      module: "Items",
      description:
        `Item ${createdItem.item_code} - ${createdItem.item_name} was created with quantity ${createdItem.quantity} ${createdItem.unit}.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message:
        "Item created successfully.",
      item: createdItem,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action: "ITEM_CREATE_ERROR",
      module: "Items",
      description:
        `Item creation process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const updateItem = async (req, res, next) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const itemId =
      Number(req.params.id);

    const {
      itemName,
      categoryId,
      supplierId,
      quantity,
      reorderLevel,
      unit,
      status,
    } = req.body;

    await connection.beginTransaction();

    const [existingItems] =
      await connection.execute(
        `
          SELECT
            item_id,
            item_code,
            item_name,
            category_id,
            supplier_id,
            quantity,
            reorder_level,
            unit,
            status
          FROM items
          WHERE item_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [itemId]
      );

    if (existingItems.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_UPDATE_FAILED",
        module: "Items",
        description:
          `Item update failed because item ID ${itemId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    const existingItem =
      existingItems[0];

    const cleanedName =
      itemName !== undefined
        ? itemName.trim()
        : existingItem.item_name;

    const finalCategoryId =
      categoryId !== undefined
        ? Number(categoryId)
        : Number(
            existingItem.category_id
          );

    const finalSupplierId =
      supplierId !== undefined
        ? Number(supplierId)
        : Number(
            existingItem.supplier_id
          );

    const finalQuantity =
      quantity !== undefined
        ? Number(quantity)
        : Number(existingItem.quantity);

    const finalReorderLevel =
      reorderLevel !== undefined
        ? Number(reorderLevel)
        : Number(
            existingItem.reorder_level
          );

    const cleanedUnit =
      unit !== undefined
        ? unit.trim()
        : existingItem.unit;

    const requestedStatus =
      status !== undefined
        ? status
        : existingItem.status;

    const referenceValidation =
      await validateCategoryAndSupplier(
        connection,
        finalCategoryId,
        finalSupplierId
      );

    if (!referenceValidation.valid) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_UPDATE_FAILED",
        module: "Items",
        description:
          `Item ${existingItem.item_code} could not be updated. ${referenceValidation.message}`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res
        .status(referenceValidation.status)
        .json({
          success: false,
          message:
            referenceValidation.message,
        });
    }

    const [duplicateItems] =
      await connection.execute(
        `
          SELECT item_id
          FROM items
          WHERE LOWER(item_name) =
                LOWER(?)
            AND item_id <> ?
          LIMIT 1
        `,
        [cleanedName, itemId]
      );

    if (duplicateItems.length > 0) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_UPDATE_FAILED",
        module: "Items",
        description:
          `Item ${existingItem.item_code} could not be updated because item name "${cleanedName}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Item name already exists.",
      });
    }

    const finalStatus =
      determineItemStatus(
        finalQuantity,
        finalReorderLevel,
        requestedStatus
      );

    await connection.execute(
      `
        UPDATE items
        SET
          item_name = ?,
          category_id = ?,
          supplier_id = ?,
          quantity = ?,
          reorder_level = ?,
          unit = ?,
          status = ?
        WHERE item_id = ?
      `,
      [
        cleanedName,
        finalCategoryId,
        finalSupplierId,
        finalQuantity,
        finalReorderLevel,
        cleanedUnit,
        finalStatus,
        itemId,
      ]
    );

    const [updatedItems] =
      await connection.execute(
        `
          SELECT
            i.item_id,
            i.item_code,
            i.item_name,
            i.category_id,
            c.category_name,
            i.supplier_id,
            s.supplier_name,
            i.quantity,
            i.reorder_level,
            i.unit,
            i.status,
            i.created_at,
            i.updated_at
          FROM items i
          LEFT JOIN categories c
            ON i.category_id =
               c.category_id
          LEFT JOIN suppliers s
            ON i.supplier_id =
               s.supplier_id
          WHERE i.item_id = ?
          LIMIT 1
        `,
        [itemId]
      );

    await connection.commit();

    const updatedItem =
      updatedItems[0];

    await createLog({
      userId,
      action: "ITEM_UPDATE",
      module: "Items",
      description:
        `Item ${updatedItem.item_code} was updated. Name: ${updatedItem.item_name}, quantity: ${updatedItem.quantity} ${updatedItem.unit}, status: ${updatedItem.status}.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Item updated successfully.",
      item: updatedItem,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action: "ITEM_UPDATE_ERROR",
      module: "Items",
      description:
        `Item update process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const deleteItem = async (req, res, next) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const itemId =
      Number(req.params.id);

    await connection.beginTransaction();

    const [items] =
      await connection.execute(
        `
          SELECT
            item_id,
            item_code,
            item_name,
            quantity,
            unit
          FROM items
          WHERE item_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [itemId]
      );

    if (items.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_DELETE_FAILED",
        module: "Items",
        description:
          `Item deletion failed because item ID ${itemId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    const item = items[0];

    const [stockInRecords] =
      await connection.execute(
        `
          SELECT COUNT(*) AS record_count
          FROM stock_in
          WHERE item_id = ?
        `,
        [itemId]
      );

    const [requestRecords] =
      await connection.execute(
        `
          SELECT COUNT(*) AS record_count
          FROM requests
          WHERE item_id = ?
        `,
        [itemId]
      );

    const [transactionRecords] =
      await connection.execute(
        `
          SELECT COUNT(*) AS record_count
          FROM transactions
          WHERE item_id = ?
        `,
        [itemId]
      );

    const stockInCount =
      Number(
        stockInRecords[0].record_count
      );

    const requestCount =
      Number(
        requestRecords[0].record_count
      );

    const transactionCount =
      Number(
        transactionRecords[0].record_count
      );

    if (
      stockInCount > 0 ||
      requestCount > 0 ||
      transactionCount > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action: "ITEM_DELETE_FAILED",
        module: "Items",
        description:
          `Item ${item.item_code} could not be deleted because it has ${stockInCount} stock-in record(s), ${requestCount} request(s), and ${transactionCount} transaction(s).`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "This item cannot be deleted because it is used by stock records, requests, or transactions.",
        relatedRecords: {
          stockIn: stockInCount,
          requests: requestCount,
          transactions:
            transactionCount,
        },
      });
    }

    await connection.execute(
      `
        DELETE FROM items
        WHERE item_id = ?
      `,
      [itemId]
    );

    await connection.commit();

    await createLog({
      userId,
      action: "ITEM_DELETE",
      module: "Items",
      description:
        `Item ${item.item_code} - ${item.item_name} was deleted.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Item deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action: "ITEM_DELETE_ERROR",
      module: "Items",
      description:
        `Item deletion process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};