const { pool } = require("../config/db");

/*
  GET /api/reports/summary
*/
const getReportSummary = async (
  req,
  res,
  next
) => {
  try {
    const [itemSummary] =
      await pool.execute(`
        SELECT
          COUNT(*) AS total_items,

          COALESCE(
            SUM(quantity),
            0
          ) AS total_quantity,

          COALESCE(
            SUM(
              CASE
                WHEN quantity = 0
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS out_of_stock_items,

          COALESCE(
            SUM(
              CASE
                WHEN quantity > 0
                  AND quantity <= reorder_level
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS low_stock_items

        FROM items
      `);

    const [transactionSummary] =
      await pool.execute(`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'Stock In'
                THEN quantity
                ELSE 0
              END
            ),
            0
          ) AS total_stock_in,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'Stock Out'
                THEN quantity
                ELSE 0
              END
            ),
            0
          ) AS total_stock_out

        FROM transactions
      `);

    const [requestSummary] =
      await pool.execute(`
        SELECT
          COUNT(*) AS total_requests,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'Pending'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS pending_requests,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'Approved'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS approved_requests,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'Rejected'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS rejected_requests

        FROM requests
      `);

    return res.status(200).json({
      success: true,

      summary: {
        ...itemSummary[0],
        ...transactionSummary[0],
        ...requestSummary[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
  GET /api/reports/daily?date=2026-09-06
*/
const getDailyReport = async (
  req,
  res,
  next
) => {
  try {
    const reportDate =
      req.query.date ||
      new Date()
        .toISOString()
        .slice(0, 10);

    const [transactions] =
      await pool.execute(
        `
          SELECT
            t.transaction_id,

            t.transaction_code,

            t.transaction_type,

            DATE_FORMAT(
              t.transaction_date,
              '%Y-%m-%d'
            ) AS transaction_date,

            t.reference_number,

            t.quantity,

            i.item_id,

            i.item_code,

            i.item_name,

            i.unit,

            c.category_id,

            c.category_name,

            s.supplier_id,

            s.supplier_name,

            employee.user_id
              AS employee_id,

            employee.full_name
              AS employee_name,

            handler.user_id
              AS handled_by,

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

          WHERE DATE(
            t.transaction_date
          ) = ?

          ORDER BY
            t.transaction_id DESC
        `,
        [reportDate]
      );

    const [summary] =
      await pool.execute(
        `
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN transaction_type =
                    'Stock In'
                  THEN quantity
                  ELSE 0
                END
              ),
              0
            ) AS total_stock_in,

            COALESCE(
              SUM(
                CASE
                  WHEN transaction_type =
                    'Stock Out'
                  THEN quantity
                  ELSE 0
                END
              ),
              0
            ) AS total_stock_out,

            COUNT(*)
              AS total_transactions

          FROM transactions

          WHERE DATE(
            transaction_date
          ) = ?
        `,
        [reportDate]
      );

    return res.status(200).json({
      success: true,

      reportType:
        "Daily Report",

      date:
        reportDate,

      summary:
        summary[0],

      count:
        transactions.length,

      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/*
  GET /api/reports/monthly?year=2026&month=9
*/
const getMonthlyReport = async (
  req,
  res,
  next
) => {
  try {
    const currentDate =
      new Date();

    const year =
      Number(
        req.query.year ||
          currentDate.getFullYear()
      );

    const month =
      Number(
        req.query.month ||
          currentDate.getMonth() +
            1
      );

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid year or month.",
      });
    }

    const [transactionSummary] =
      await pool.execute(
        `
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN transaction_type =
                    'Stock In'
                  THEN quantity
                  ELSE 0
                END
              ),
              0
            ) AS total_stock_in,

            COALESCE(
              SUM(
                CASE
                  WHEN transaction_type =
                    'Stock Out'
                  THEN quantity
                  ELSE 0
                END
              ),
              0
            ) AS total_stock_out,

            COUNT(*)
              AS total_transactions

          FROM transactions

          WHERE
            YEAR(
              transaction_date
            ) = ?

            AND MONTH(
              transaction_date
            ) = ?
        `,
        [
          year,
          month,
        ]
      );

    const [requestSummary] =
      await pool.execute(
        `
          SELECT
            COUNT(*)
              AS total_requests,

            COALESCE(
              SUM(
                CASE
                  WHEN status =
                    'Pending'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS pending_requests,

            COALESCE(
              SUM(
                CASE
                  WHEN status =
                    'Approved'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS approved_requests,

            COALESCE(
              SUM(
                CASE
                  WHEN status =
                    'Rejected'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS rejected_requests

          FROM requests

          WHERE
            YEAR(
              request_date
            ) = ?

            AND MONTH(
              request_date
            ) = ?
        `,
        [
          year,
          month,
        ]
      );

    const [
      frequentlyRequestedItems,
    ] = await pool.execute(
      `
        SELECT
          i.item_id,

          i.item_code,

          i.item_name,

          i.unit,

          COUNT(
            r.request_id
          ) AS request_count,

          COALESCE(
            SUM(
              r.quantity
            ),
            0
          ) AS total_requested_quantity

        FROM requests r

        INNER JOIN items i
          ON r.item_id =
             i.item_id

        WHERE
          YEAR(
            r.request_date
          ) = ?

          AND MONTH(
            r.request_date
          ) = ?

        GROUP BY
          i.item_id,
          i.item_code,
          i.item_name,
          i.unit

        ORDER BY
          total_requested_quantity DESC

        LIMIT 10
      `,
      [
        year,
        month,
      ]
    );

    const [lowStockItems] =
      await pool.execute(`
        SELECT
          i.item_id,

          i.item_code,

          i.item_name,

          i.quantity,

          i.reorder_level,

          i.unit,

          i.status,

          c.category_name,

          s.supplier_name

        FROM items i

        LEFT JOIN categories c
          ON i.category_id =
             c.category_id

        LEFT JOIN suppliers s
          ON i.supplier_id =
             s.supplier_id

        WHERE
          i.quantity <=
          i.reorder_level

        ORDER BY
          i.quantity ASC,
          i.item_name ASC
      `);

    return res.status(200).json({
      success: true,

      reportType:
        "Monthly Report",

      year,

      month,

      transactionSummary:
        transactionSummary[0],

      requestSummary:
        requestSummary[0],

      frequentlyRequestedItems,

      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};

/*
  GET /api/reports/low-stock
*/
const getLowStockReport = async (
  req,
  res,
  next
) => {
  try {
    const [items] =
      await pool.execute(`
        SELECT
          i.item_id,

          i.item_code,

          i.item_name,

          i.quantity,

          i.reorder_level,

          i.unit,

          i.status,

          c.category_id,

          c.category_name,

          s.supplier_id,

          s.supplier_name

        FROM items i

        LEFT JOIN categories c
          ON i.category_id =
             c.category_id

        LEFT JOIN suppliers s
          ON i.supplier_id =
             s.supplier_id

        WHERE
          i.quantity <=
          i.reorder_level

        ORDER BY
          i.quantity ASC,
          i.item_name ASC
      `);

    return res.status(200).json({
      success: true,

      reportType:
        "Low Stock Report",

      count:
        items.length,

      items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportSummary,
  getDailyReport,
  getMonthlyReport,
  getLowStockReport,
};