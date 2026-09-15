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

const generateCategoryCode = async (
  connection
) => {
  const [rows] = await connection.execute(`
    SELECT
      COALESCE(
        MAX(
          CAST(
            SUBSTRING_INDEX(
              category_code,
              '-',
              -1
            ) AS UNSIGNED
          )
        ),
        0
      ) AS last_number
    FROM categories
  `);

  const nextNumber =
    Number(rows[0].last_number) + 1;

  return `CAT-${String(nextNumber).padStart(
    3,
    "0"
  )}`;
};

const getAllCategories = async (
  req,
  res,
  next
) => {
  try {
    const {
      search,
      status,
    } = req.query;

    let sql = `
      SELECT
        category_id,
        category_code,
        category_name,
        description,
        status,
        created_at,
        updated_at
      FROM categories
      WHERE 1 = 1
    `;

    const values = [];

    if (search) {
      sql += `
        AND (
          category_code LIKE ?
          OR category_name LIKE ?
          OR description LIKE ?
        )
      `;

      const searchValue =
        `%${search.trim()}%`;

      values.push(
        searchValue,
        searchValue,
        searchValue
      );
    }

    if (status) {
      sql += `
        AND status = ?
      `;

      values.push(status);
    }

    sql += `
      ORDER BY category_id DESC
    `;

    const [categories] =
      await pool.execute(sql, values);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (
  req,
  res,
  next
) => {
  try {
    const categoryId =
      Number(req.params.id);

    const [categories] =
      await pool.execute(
        `
          SELECT
            category_id,
            category_code,
            category_name,
            description,
            status,
            created_at,
            updated_at
          FROM categories
          WHERE category_id = ?
          LIMIT 1
        `,
        [categoryId]
      );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category: categories[0],
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (
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
      categoryName,
      description,
      status,
    } = req.body;

    const cleanCategoryName =
      categoryName.trim();

    await connection.beginTransaction();

    const [existingCategories] =
      await connection.execute(
        `
          SELECT category_id
          FROM categories
          WHERE LOWER(category_name) =
                LOWER(?)
          LIMIT 1
        `,
        [cleanCategoryName]
      );

    if (
      existingCategories.length > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "CATEGORY_CREATE_FAILED",
        module: "Categories",
        description:
          `Category creation failed because "${cleanCategoryName}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Category name already exists.",
      });
    }

    const categoryCode =
      await generateCategoryCode(
        connection
      );

    const [result] =
      await connection.execute(
        `
          INSERT INTO categories (
            category_code,
            category_name,
            description,
            status
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          categoryCode,
          cleanCategoryName,
          description?.trim() || null,
          status || "Active",
        ]
      );

    const [createdCategories] =
      await connection.execute(
        `
          SELECT
            category_id,
            category_code,
            category_name,
            description,
            status,
            created_at,
            updated_at
          FROM categories
          WHERE category_id = ?
          LIMIT 1
        `,
        [result.insertId]
      );

    await connection.commit();

    const createdCategory =
      createdCategories[0];

    await createLog({
      userId,
      action: "CATEGORY_CREATE",
      module: "Categories",
      description:
        `Category ${createdCategory.category_code} - ${createdCategory.category_name} was created.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message:
        "Category created successfully.",
      category: createdCategory,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "CATEGORY_CREATE_ERROR",
      module: "Categories",
      description:
        `Category creation process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const updateCategory = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const categoryId =
      Number(req.params.id);

    const {
      categoryName,
      description,
      status,
    } = req.body;

    await connection.beginTransaction();

    const [categories] =
      await connection.execute(
        `
          SELECT
            category_id,
            category_code,
            category_name,
            description,
            status
          FROM categories
          WHERE category_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [categoryId]
      );

    if (categories.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "CATEGORY_UPDATE_FAILED",
        module: "Categories",
        description:
          `Category update failed because category ID ${categoryId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const existingCategory =
      categories[0];

    const finalCategoryName =
      categoryName !== undefined
        ? categoryName.trim()
        : existingCategory.category_name;

    const finalDescription =
      description !== undefined
        ? description?.trim() || null
        : existingCategory.description;

    const finalStatus =
      status !== undefined
        ? status
        : existingCategory.status;

    const [duplicateCategories] =
      await connection.execute(
        `
          SELECT category_id
          FROM categories
          WHERE LOWER(category_name) =
                LOWER(?)
            AND category_id <> ?
          LIMIT 1
        `,
        [
          finalCategoryName,
          categoryId,
        ]
      );

    if (
      duplicateCategories.length > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "CATEGORY_UPDATE_FAILED",
        module: "Categories",
        description:
          `Category update failed because "${finalCategoryName}" already exists.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "Category name already exists.",
      });
    }

    await connection.execute(
      `
        UPDATE categories
        SET
          category_name = ?,
          description = ?,
          status = ?
        WHERE category_id = ?
      `,
      [
        finalCategoryName,
        finalDescription,
        finalStatus,
        categoryId,
      ]
    );

    const [updatedCategories] =
      await connection.execute(
        `
          SELECT
            category_id,
            category_code,
            category_name,
            description,
            status,
            created_at,
            updated_at
          FROM categories
          WHERE category_id = ?
          LIMIT 1
        `,
        [categoryId]
      );

    await connection.commit();

    const updatedCategory =
      updatedCategories[0];

    await createLog({
      userId,
      action: "CATEGORY_UPDATE",
      module: "Categories",
      description:
        `Category ${updatedCategory.category_code} was updated. Name: ${updatedCategory.category_name}, status: ${updatedCategory.status}.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "CATEGORY_UPDATE_ERROR",
      module: "Categories",
      description:
        `Category update process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

const deleteCategory = async (
  req,
  res,
  next
) => {
  const connection =
    await pool.getConnection();

  const userId =
    getAuthenticatedUserId(req);

  try {
    const categoryId =
      Number(req.params.id);

    await connection.beginTransaction();

    const [categories] =
      await connection.execute(
        `
          SELECT
            category_id,
            category_code,
            category_name
          FROM categories
          WHERE category_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [categoryId]
      );

    if (categories.length === 0) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "CATEGORY_DELETE_FAILED",
        module: "Categories",
        description:
          `Category deletion failed because category ID ${categoryId} does not exist.`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const category = categories[0];

    const [usedItems] =
      await connection.execute(
        `
          SELECT COUNT(*) AS item_count
          FROM items
          WHERE category_id = ?
        `,
        [categoryId]
      );

    if (
      Number(usedItems[0].item_count) > 0
    ) {
      await connection.rollback();

      await createLog({
        userId,
        action:
          "CATEGORY_DELETE_FAILED",
        module: "Categories",
        description:
          `Category ${category.category_code} could not be deleted because it is assigned to ${usedItems[0].item_count} item(s).`,
        logLevel: "WARNING",
        ipAddress: getClientIp(req),
      });

      return res.status(409).json({
        success: false,
        message:
          "This category cannot be deleted because it is assigned to one or more items.",
        itemCount:
          Number(
            usedItems[0].item_count
          ),
      });
    }

    await connection.execute(
      `
        DELETE FROM categories
        WHERE category_id = ?
      `,
      [categoryId]
    );

    await connection.commit();

    await createLog({
      userId,
      action: "CATEGORY_DELETE",
      module: "Categories",
      description:
        `Category ${category.category_code} - ${category.category_name} was deleted.`,
      logLevel: "INFO",
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Category deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();

    await createLog({
      userId,
      action:
        "CATEGORY_DELETE_ERROR",
      module: "Categories",
      description:
        `Category deletion process failed: ${error.message}`,
      logLevel: "ERROR",
      ipAddress: getClientIp(req),
    });

    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};