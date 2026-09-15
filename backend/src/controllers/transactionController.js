const { pool } = require("../config/db");

const getAllTransactions = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
      fromDate,
      toDate,
      itemId,
    } = req.query;

    let sql = `
      SELECT
        t.transaction_id,
        t.transaction_code,
        t.transaction_type,

        t.item_id,
        i.item_code,
        i.item_name,
        i.unit,

        c.category_id,
        c.category_name,

        t.quantity,

        t.reference_number,

        t.supplier_id,
        s.supplier_code,
        s.supplier_name,

        t.employee_id,

        employee.user_code
          AS employee_code,

        employee.full_name
          AS employee_name,

        DATE_FORMAT(
          t.transaction_date,
          '%Y-%m-%d'
        ) AS transaction_date,

        t.handled_by,

        handler.user_code
          AS handled_by_code,

        handler.full_name
          AS handled_by_name,

        t.note

      FROM transactions t

      INNER JOIN items i
        ON t.item_id =
           i.item_id

      LEFT JOIN categories c
        ON i.category_id =
           c.category_id

      LEFT JOIN suppliers s
        ON t.supplier_id =
           s.supplier_id

      LEFT JOIN users employee
        ON t.employee_id =
           employee.user_id

      LEFT JOIN users handler
        ON t.handled_by =
           handler.user_id

      WHERE 1 = 1
    `;

    const values = [];

    if (type) {
      sql += `
        AND t.transaction_type = ?
      `;

      values.push(type);
    }

    if (fromDate) {
      sql += `
        AND DATE(
          t.transaction_date
        ) >= ?
      `;

      values.push(fromDate);
    }

    if (toDate) {
      sql += `
        AND DATE(
          t.transaction_date
        ) <= ?
      `;

      values.push(toDate);
    }

    if (itemId) {
      sql += `
        AND t.item_id = ?
      `;

      values.push(
        Number(itemId)
      );
    }

    sql += `
      ORDER BY
        t.transaction_date DESC,
        t.transaction_id DESC
    `;

    const [transactions] =
      await pool.execute(
        sql,
        values
      );

    return res
      .status(200)
      .json({
        success: true,
        count:
          transactions.length,
        transactions,
      });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (
  req,
  res,
  next
) => {
  try {
    const transactionId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        transactionId
      ) ||
      transactionId <= 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid transaction ID.",
        });
    }

    const [transactions] =
      await pool.execute(
        `
          SELECT
            t.transaction_id,
            t.transaction_code,
            t.transaction_type,

            t.item_id,
            i.item_code,
            i.item_name,
            i.unit,

            c.category_id,
            c.category_name,

            t.quantity,

            t.reference_number,

            t.supplier_id,
            s.supplier_code,
            s.supplier_name,

            t.employee_id,

            employee.user_code
              AS employee_code,

            employee.full_name
              AS employee_name,

            DATE_FORMAT(
              t.transaction_date,
              '%Y-%m-%d'
            ) AS transaction_date,

            t.handled_by,

            handler.user_code
              AS handled_by_code,

            handler.full_name
              AS handled_by_name,

            t.note

          FROM transactions t

          INNER JOIN items i
            ON t.item_id =
               i.item_id

          LEFT JOIN categories c
            ON i.category_id =
               c.category_id

          LEFT JOIN suppliers s
            ON t.supplier_id =
               s.supplier_id

          LEFT JOIN users employee
            ON t.employee_id =
               employee.user_id

          LEFT JOIN users handler
            ON t.handled_by =
               handler.user_id

          WHERE
            t.transaction_id = ?

          LIMIT 1
        `,
        [transactionId]
      );

    if (
      transactions.length === 0
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Transaction not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        transaction:
          transactions[0],
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
};