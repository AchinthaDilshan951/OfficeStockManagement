const {
  pool,
} = require("../config/db");

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

const getAllSuppliers = async (
  req,
  res,
  next
) => {
  try {
    const [suppliers] =
      await pool.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          FROM suppliers
          ORDER BY supplier_id DESC
        `
      );

    return res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    next(error);
  }
};

const getSupplierById = async (
  req,
  res,
  next
) => {
  try {
    const supplierId =
      Number(req.params.id);

    const [suppliers] =
      await pool.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          FROM suppliers
          WHERE supplier_id = ?
          LIMIT 1
        `,
        [supplierId]
      );

    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Supplier not found.",
      });
    }

    return res.status(200).json({
      success: true,
      supplier: suppliers[0],
    });
  } catch (error) {
    next(error);
  }
};

const generateSupplierCode =
  async (connection) => {
    const [rows] =
      await connection.execute(
        `
          SELECT
            COALESCE(
              MAX(
                CAST(
                  SUBSTRING_INDEX(
                    supplier_code,
                    '-',
                    -1
                  ) AS UNSIGNED
                )
              ),
              0
            ) AS last_number
          FROM suppliers
        `
      );

    const nextNumber =
      Number(
        rows[0].last_number
      ) + 1;

    return `SUP-${String(
      nextNumber
    ).padStart(3, "0")}`;
  };

const createSupplier = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const {
      supplierName,
      contactPerson,
      phone,
      email,
      address,
      status,
    } = req.body;

    const cleanedName =
      supplierName.trim();

    const cleanedEmail =
      email.trim().toLowerCase();

    const cleanedContactPerson =
      contactPerson.trim();

    const cleanedPhone =
      phone.trim();

    const cleanedAddress =
      address.trim();

    await connection.beginTransaction();

    const [existingSuppliers] =
      await connection.execute(
        `
          SELECT supplier_id
          FROM suppliers
          WHERE LOWER(supplier_name) =
                LOWER(?)
             OR LOWER(email) =
                LOWER(?)
          LIMIT 1
        `,
        [
          cleanedName,
          cleanedEmail,
        ]
      );

    if (
      existingSuppliers.length > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "SUPPLIER_CREATE_FAILED",
        module: "Suppliers",
        description:
          `Supplier creation failed because supplier name "${cleanedName}" or email "${cleanedEmail}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Supplier name or email already exists.",
      });
    }

    const supplierCode =
      await generateSupplierCode(
        connection
      );

    const [result] =
      await connection.execute(
        `
          INSERT INTO suppliers (
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          supplierCode,
          cleanedName,
          cleanedContactPerson,
          cleanedPhone,
          cleanedEmail,
          cleanedAddress,
          status || "Active",
        ]
      );

    const [createdSuppliers] =
      await connection.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          FROM suppliers
          WHERE supplier_id = ?
          LIMIT 1
        `,
        [result.insertId]
      );

    await connection.commit();

    const createdSupplier =
      createdSuppliers[0];

    await createLog({
      userId,
      action: "SUPPLIER_CREATE",
      module: "Suppliers",
      description:
        `Supplier ${createdSupplier.supplier_code} - ${createdSupplier.supplier_name} was created.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message:
        "Supplier created successfully.",
      supplier: createdSupplier,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "SUPPLIER_CREATE_ERROR",
      module: "Suppliers",
      description:
        `Supplier creation process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const updateSupplier = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const supplierId =
      Number(req.params.id);

    const {
      supplierName,
      contactPerson,
      phone,
      email,
      address,
      status,
    } = req.body;

    await connection.beginTransaction();

    const [supplierRows] =
      await connection.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status
          FROM suppliers
          WHERE supplier_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [supplierId]
      );

    if (supplierRows.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "SUPPLIER_UPDATE_FAILED",
        module: "Suppliers",
        description:
          `Supplier update failed because supplier ID ${supplierId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message:
          "Supplier not found.",
      });
    }

    const existingSupplier =
      supplierRows[0];

    const cleanedName =
      supplierName !== undefined
        ? supplierName.trim()
        : existingSupplier.supplier_name;

    const cleanedContactPerson =
      contactPerson !== undefined
        ? contactPerson.trim()
        : existingSupplier.contact_person;

    const cleanedPhone =
      phone !== undefined
        ? phone.trim()
        : existingSupplier.phone;

    const cleanedEmail =
      email !== undefined
        ? email.trim().toLowerCase()
        : existingSupplier.email;

    const cleanedAddress =
      address !== undefined
        ? address.trim()
        : existingSupplier.address;

    const finalStatus =
      status !== undefined
        ? status
        : existingSupplier.status;

    const [duplicateSuppliers] =
      await connection.execute(
        `
          SELECT supplier_id
          FROM suppliers
          WHERE (
            LOWER(supplier_name) =
              LOWER(?)
            OR LOWER(email) =
              LOWER(?)
          )
          AND supplier_id <> ?
          LIMIT 1
        `,
        [
          cleanedName,
          cleanedEmail,
          supplierId,
        ]
      );

    if (
      duplicateSuppliers.length > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "SUPPLIER_UPDATE_FAILED",
        module: "Suppliers",
        description:
          `Supplier update failed because supplier name "${cleanedName}" or email "${cleanedEmail}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Supplier name or email already exists.",
      });
    }

    await connection.execute(
      `
        UPDATE suppliers
        SET
          supplier_name = ?,
          contact_person = ?,
          phone = ?,
          email = ?,
          address = ?,
          status = ?
        WHERE supplier_id = ?
      `,
      [
        cleanedName,
        cleanedContactPerson,
        cleanedPhone,
        cleanedEmail,
        cleanedAddress,
        finalStatus,
        supplierId,
      ]
    );

    const [updatedSuppliers] =
      await connection.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          FROM suppliers
          WHERE supplier_id = ?
          LIMIT 1
        `,
        [supplierId]
      );

    await connection.commit();

    const updatedSupplier =
      updatedSuppliers[0];

    await createLog({
      userId,
      action: "SUPPLIER_UPDATE",
      module: "Suppliers",
      description:
        `Supplier ${updatedSupplier.supplier_code} was updated. Name: ${updatedSupplier.supplier_name}, status: ${updatedSupplier.status}.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Supplier updated successfully.",
      supplier: updatedSupplier,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "SUPPLIER_UPDATE_ERROR",
      module: "Suppliers",
      description:
        `Supplier update process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const deleteSupplier = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const supplierId =
      Number(req.params.id);

    await connection.beginTransaction();

    const [suppliers] =
      await connection.execute(
        `
          SELECT
            supplier_id,
            supplier_code,
            supplier_name
          FROM suppliers
          WHERE supplier_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [supplierId]
      );

    if (suppliers.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "SUPPLIER_DELETE_FAILED",
        module: "Suppliers",
        description:
          `Supplier deletion failed because supplier ID ${supplierId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message:
          "Supplier not found.",
      });
    }

    const supplier = suppliers[0];

    const [usedItems] =
      await connection.execute(
        `
          SELECT COUNT(*) AS item_count
          FROM items
          WHERE supplier_id = ?
        `,
        [supplierId]
      );

    const itemCount =
      Number(
        usedItems[0].item_count
      );

    if (itemCount > 0) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "SUPPLIER_DELETE_FAILED",
        module: "Suppliers",
        description:
          `Supplier ${supplier.supplier_code} could not be deleted because it is assigned to ${itemCount} item(s).`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "This supplier cannot be deleted because it is used by one or more items.",
        itemCount,
      });
    }

    await connection.execute(
      `
        DELETE FROM suppliers
        WHERE supplier_id = ?
      `,
      [supplierId]
    );

    await connection.commit();

    await createLog({
      userId,
      action: "SUPPLIER_DELETE",
      module: "Suppliers",
      description:
        `Supplier ${supplier.supplier_code} - ${supplier.supplier_name} was deleted.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Supplier deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "SUPPLIER_DELETE_ERROR",
      module: "Suppliers",
      description:
        `Supplier deletion process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};