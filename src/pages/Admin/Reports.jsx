import {
  useEffect,
  useMemo,
  useState,
} from "react";

import reportService from "../../services/reportService";
import itemService from "../../services/itemService";

import "./Reports.css";

function Reports() {
  const [summary, setSummary] = useState({
    total_items: 0,
    total_quantity: 0,
    out_of_stock_items: 0,
    low_stock_items: 0,
    total_stock_in: 0,
    total_stock_out: 0,
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
  });

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [items, setItems] =
    useState([]);

  const [
    lowStockItems,
    setLowStockItems,
  ] = useState([]);

  const [
    selectedReport,
    setSelectedReport,
  ] = useState("All");

  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    reportMode,
    setReportMode,
  ] = useState("All Reports");

  const normalizeItem = (
    item
  ) => ({
    id:
      item.item_id ??
      item.id,

    code:
      item.item_code ??
      item.itemCode ??
      item.code ??
      "",

    name:
      item.item_name ??
      item.itemName ??
      item.name ??
      "",

    category:
      item.category_name ??
      item.category ??
      "Not Specified",

    supplier:
      item.supplier_name ??
      item.supplier ??
      "Not Specified",

    quantity: Number(
      item.quantity || 0
    ),

    reorderLevel: Number(
      item.reorder_level ??
        item.reorderLevel ??
        10
    ),

    unit:
      item.unit ||
      "Piece",
  });

  const findCategory = (
    transaction
  ) => {
    const itemId =
      transaction.item_id ??
      transaction.itemId;

    const itemCode =
      transaction.item_code ??
      transaction.itemCode;

    const itemName =
      transaction.item_name ??
      transaction.itemName ??
      transaction.item;

    const matchedItem =
      items.find((item) => {
        if (
          itemId != null &&
          item.id != null &&
          String(item.id) ===
            String(itemId)
        ) {
          return true;
        }

        if (
          itemCode &&
          item.code &&
          String(item.code) ===
            String(itemCode)
        ) {
          return true;
        }

        return (
          String(
            item.name || ""
          )
            .trim()
            .toLowerCase() ===
          String(
            itemName || ""
          )
            .trim()
            .toLowerCase()
        );
      });

    return (
      transaction.category_name ??
      transaction.category ??
      matchedItem?.category ??
      "Not Specified"
    );
  };

  const normalizeTransaction = (
    transaction
  ) => {
    const transactionId =
      transaction.transaction_id ??
      transaction.id;

    const transactionCode =
      transaction.transaction_code ??
      transaction.code ??
      transaction.transactionCode ??
      `TRN-${String(
        transactionId || ""
      ).padStart(3, "0")}`;

    const type =
      transaction.transaction_type ??
      transaction.type ??
      "Unknown";

    const itemName =
      transaction.item_name ??
      transaction.item ??
      transaction.itemName ??
      "Unknown Item";

    const rawDate =
      transaction.transaction_date ??
      transaction.date ??
      transaction.created_at ??
      "";

    const date = rawDate
      ? String(rawDate).slice(
          0,
          10
        )
      : "";

    const supplier =
      transaction.supplier_name ??
      transaction.supplier ??
      "";

    const employee =
      transaction.employee_name ??
      transaction.employee ??
      "";

    const handledBy =
      transaction.handled_by_name ??
      transaction.handledByName ??
      "";

    let party =
      "Not Specified";

    if (type === "Stock In") {
      party =
        supplier ||
        handledBy ||
        "Not Specified";
    } else if (
      type === "Stock Out"
    ) {
      party =
        employee ||
        handledBy ||
        "Not Specified";
    }

    return {
      id:
        transactionId,

      code:
        transactionCode,

      type,

      item:
        itemName,

      category:
        findCategory(
          transaction
        ),

      quantity:
        Number(
          transaction.quantity ||
            0
        ),

      date,

      reference:
        transaction.reference_number ??
        transaction.reference ??
        "N/A",

      party,

      note:
        transaction.note ??
        "",

      itemId:
        transaction.item_id ??
        transaction.itemId ??
        null,
    };
  };

  const normalizeLowStockItem = (
    item
  ) => ({
    id:
      item.item_id ??
      item.id,

    code:
      item.item_code ??
      item.code ??
      "",

    item:
      item.item_name ??
      item.name ??
      "Unknown Item",

    category:
      item.category_name ??
      item.category ??
      "Not Specified",

    supplier:
      item.supplier_name ??
      item.supplier ??
      "Not Specified",

    quantity:
      Number(
        item.quantity || 0
      ),

    minimumLevel:
      Number(
        item.reorder_level ??
          item.reorderLevel ??
          10
      ),

    unit:
      item.unit ||
      "Piece",

    status:
      item.status ||
      "Active",
  });

  const extractTransactions = (
    response
  ) => {
    if (
      Array.isArray(response)
    ) {
      return response;
    }

    if (
      Array.isArray(
        response?.transactions
      )
    ) {
      return response.transactions;
    }

    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }

    return [];
  };

  const mapTransactions = (
    transactionList,
    itemList
  ) => {
    return transactionList.map(
      (transaction) => {
        const itemId =
          transaction.item_id ??
          transaction.itemId;

        const itemCode =
          transaction.item_code ??
          transaction.itemCode;

        const itemName =
          transaction.item_name ??
          transaction.item ??
          "";

        const matchedItem =
          itemList.find(
            (item) => {
              if (
                itemId != null &&
                String(
                  item.id
                ) ===
                  String(
                    itemId
                  )
              ) {
                return true;
              }

              if (
                itemCode &&
                String(
                  item.code
                ) ===
                  String(
                    itemCode
                  )
              ) {
                return true;
              }

              return (
                String(
                  item.name
                )
                  .trim()
                  .toLowerCase() ===
                String(
                  itemName
                )
                  .trim()
                  .toLowerCase()
              );
            }
          );

        const normalized =
          normalizeTransaction(
            transaction
          );

        return {
          ...normalized,

          category:
            transaction.category_name ??
            transaction.category ??
            matchedItem?.category ??
            normalized.category ??
            "Not Specified",
        };
      }
    );
  };

  const loadBaseData =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          summaryResponse,
          lowStockResponse,
          transactionResponse,
          itemResponse,
        ] = await Promise.all([
          reportService.getSummary(),

          reportService.getLowStockReport(),

          reportService.getTransactions(),

          itemService.getAllItems(),
        ]);

        const itemList =
          Array.isArray(
            itemResponse
          )
            ? itemResponse
            : Array.isArray(
                  itemResponse?.items
                )
              ? itemResponse.items
              : Array.isArray(
                    itemResponse?.data
                  )
                ? itemResponse.data
                : [];

        const normalizedItems =
          itemList.map(
            normalizeItem
          );

        setItems(
          normalizedItems
        );

        const summaryData =
          summaryResponse?.summary ||
          {};

        setSummary({
          total_items:
            Number(
              summaryData.total_items ||
                0
            ),

          total_quantity:
            Number(
              summaryData.total_quantity ||
                0
            ),

          out_of_stock_items:
            Number(
              summaryData.out_of_stock_items ||
                0
            ),

          low_stock_items:
            Number(
              summaryData.low_stock_items ||
                0
            ),

          total_stock_in:
            Number(
              summaryData.total_stock_in ||
                0
            ),

          total_stock_out:
            Number(
              summaryData.total_stock_out ||
                0
            ),

          total_requests:
            Number(
              summaryData.total_requests ||
                0
            ),

          pending_requests:
            Number(
              summaryData.pending_requests ||
                0
            ),

          approved_requests:
            Number(
              summaryData.approved_requests ||
                0
            ),

          rejected_requests:
            Number(
              summaryData.rejected_requests ||
                0
            ),
        });

        const lowStockList =
          Array.isArray(
            lowStockResponse?.items
          )
            ? lowStockResponse.items
            : Array.isArray(
                  lowStockResponse
                )
              ? lowStockResponse
              : [];

        setLowStockItems(
          lowStockList.map(
            normalizeLowStockItem
          )
        );

        const transactionList =
          extractTransactions(
            transactionResponse
          );

        const normalizedTransactions =
          mapTransactions(
            transactionList,
            normalizedItems
          );

        setTransactions(
          normalizedTransactions
        );

        setReportMode(
          "All Reports"
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Failed to load report data."
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadBaseData();
  }, []);

  const filteredData =
    useMemo(() => {
      return transactions.filter(
        (record) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              record.code || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.item || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.category ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.reference ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.party || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesType =
            selectedReport ===
              "All" ||
            record.type ===
              selectedReport;

          const matchesFromDate =
            fromDate === "" ||
            record.date >=
              fromDate;

          const matchesToDate =
            toDate === "" ||
            record.date <=
              toDate;

          return (
            matchesSearch &&
            matchesType &&
            matchesFromDate &&
            matchesToDate
          );
        }
      );
    }, [
      transactions,
      searchTerm,
      selectedReport,
      fromDate,
      toDate,
    ]);

  const clearFilters =
    async () => {
      setSearchTerm("");

      setSelectedReport(
        "All"
      );

      setFromDate("");

      setToDate("");

      setReportMode(
        "All Reports"
      );

      await loadBaseData();
    };

  const loadDailyReport =
    async () => {
      if (!fromDate) {
        window.alert(
          "Please select a date first."
        );

        return;
      }

      const reportDate =
        fromDate;

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await reportService.getDailyReport(
            reportDate
          );

        const transactionList =
          Array.isArray(
            response?.transactions
          )
            ? response.transactions
            : [];

        const normalizedTransactions =
          mapTransactions(
            transactionList,
            items
          );

        setTransactions(
          normalizedTransactions
        );

        setSelectedReport(
          "All"
        );

        setFromDate(
          reportDate
        );

        setToDate(
          reportDate
        );

        setReportMode(
          `Daily Report - ${reportDate}`
        );
      } catch (error) {
        setTransactions([]);

        setErrorMessage(
          error.message ||
            "Failed to load daily report."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const loadMonthlyReport =
    async () => {
      if (!fromDate) {
        window.alert(
          "Please select a date first."
        );

        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          yearText,
          monthText,
        ] =
          fromDate.split("-");

        const year =
          Number(yearText);

        const month =
          Number(monthText);

        if (
          !year ||
          !month
        ) {
          window.alert(
            "Please select a valid date."
          );

          return;
        }

        const firstDay =
          `${year}-${String(
            month
          ).padStart(
            2,
            "0"
          )}-01`;

        const lastDate =
          new Date(
            year,
            month,
            0
          ).getDate();

        const lastDay =
          `${year}-${String(
            month
          ).padStart(
            2,
            "0"
          )}-${String(
            lastDate
          ).padStart(
            2,
            "0"
          )}`;

        const [
          monthlyResponse,
          transactionResponse,
        ] = await Promise.all([
          reportService.getMonthlyReport(
            year,
            month
          ),

          reportService.getTransactions(
            {
              fromDate:
                firstDay,

              toDate:
                lastDay,
            }
          ),
        ]);

        const transactionList =
          extractTransactions(
            transactionResponse
          );

        const normalizedTransactions =
          mapTransactions(
            transactionList,
            items
          );

        setTransactions(
          normalizedTransactions
        );

        setFromDate(
          firstDay
        );

        setToDate(
          lastDay
        );

        setSelectedReport(
          "All"
        );

        setReportMode(
          `Monthly Report - ${year}-${String(
            month
          ).padStart(
            2,
            "0"
          )}`
        );

        const monthlyLowStock =
          Array.isArray(
            monthlyResponse?.lowStockItems
          )
            ? monthlyResponse.lowStockItems
            : [];

        setLowStockItems(
          monthlyLowStock.map(
            normalizeLowStockItem
          )
        );
      } catch (error) {
        setTransactions([]);

        setErrorMessage(
          error.message ||
            "Failed to load monthly report."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const exportCsv = () => {
    if (
      filteredData.length ===
      0
    ) {
      window.alert(
        "There are no report records to export."
      );

      return;
    }

    const headers = [
      "Transaction ID",
      "Type",
      "Item",
      "Category",
      "Quantity",
      "Date",
      "Reference",
      "Supplier / Employee",
    ];

    const rows =
      filteredData.map(
        (record) => [
          record.code,
          record.type,
          record.item,
          record.category,
          record.quantity,
          record.date,
          record.reference,
          record.party,
        ]
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const escapedValue =
              String(
                value ?? ""
              ).replaceAll(
                '"',
                '""'
              );

            return `"${escapedValue}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const downloadUrl =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      downloadUrl;

    link.download =
      "office-stock-report.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      downloadUrl
    );
  };

  const printReport = () => {
    window.print();
  };

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <div>
          <h2>
            Reports
          </h2>

          <p>
            View stock summaries
            and transaction reports.
          </p>
        </div>

        <div className="report-heading-actions">
          <button
            type="button"
            className="export-report-button"
            onClick={
              exportCsv
            }
          >
            Export CSV
          </button>

          <button
            type="button"
            className="print-report-button"
            onClick={
              printReport
            }
          >
            Print / PDF
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="reports-empty-message">
          {errorMessage}
        </div>
      )}

      <div className="report-summary-grid">
        <article className="report-summary-card">
          <div className="report-summary-icon stock-icon">
            📦
          </div>

          <div>
            <span>
              Current Stock
            </span>

            <strong>
              {
                summary.total_quantity
              }
            </strong>
          </div>
        </article>

        <article className="report-summary-card">
          <div className="report-summary-icon in-icon">
            📥
          </div>

          <div>
            <span>
              Total Stock In
            </span>

            <strong>
              {
                summary.total_stock_in
              }
            </strong>
          </div>
        </article>

        <article className="report-summary-card">
          <div className="report-summary-icon out-icon">
            📤
          </div>

          <div>
            <span>
              Total Stock Out
            </span>

            <strong>
              {
                summary.total_stock_out
              }
            </strong>
          </div>
        </article>

        <article className="report-summary-card">
          <div className="report-summary-icon low-icon">
            ⚠️
          </div>

          <div>
            <span>
              Low Stock Items
            </span>

            <strong>
              {
                lowStockItems.length
              }
            </strong>
          </div>
        </article>
      </div>

      <div className="reports-content-grid">
        <div className="reports-panel">
          <div className="reports-toolbar">
            <input
              type="text"
              placeholder="Search report records..."
              value={
                searchTerm
              }
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

            <select
              value={
                selectedReport
              }
              onChange={(event) =>
                setSelectedReport(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Reports
              </option>

              <option value="Stock In">
                Stock In
              </option>

              <option value="Stock Out">
                Stock Out
              </option>
            </select>

            <input
              type="date"
              value={
                fromDate
              }
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
              title="From date"
            />

            <input
              type="date"
              value={
                toDate
              }
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
              title="To date"
            />

            <button
              type="button"
              className="report-clear-button"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "8px",
              marginBottom:
                "12px",
              flexWrap:
                "wrap",
            }}
          >
            <button
              type="button"
              className="report-clear-button"
              onClick={
                loadDailyReport
              }
            >
              Daily Report
            </button>

            <button
              type="button"
              className="report-clear-button"
              onClick={
                loadMonthlyReport
              }
            >
              Monthly Report
            </button>

            <span
              style={{
                fontSize:
                  "12px",
                fontWeight:
                  "700",
              }}
            >
              {reportMode}
            </span>
          </div>

          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>
                    Transaction ID
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Item
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Reference
                  </th>

                  <th>
                    Supplier /
                    Employee
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="reports-empty-message"
                    >
                      Loading report
                      data...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredData.map(
                      (record) => (
                        <tr
                          key={
                            record.id ||
                            record.code
                          }
                        >
                          <td>
                            {
                              record.code
                            }
                          </td>

                          <td>
                            <span
                              className={
                                record.type ===
                                "Stock In"
                                  ? "report-type stock-in"
                                  : "report-type stock-out"
                              }
                            >
                              {
                                record.type
                              }
                            </span>
                          </td>

                          <td className="report-item">
                            {
                              record.item
                            }
                          </td>

                          <td>
                            {
                              record.category
                            }
                          </td>

                          <td>
                            <span
                              className={
                                record.type ===
                                "Stock In"
                                  ? "report-quantity quantity-in"
                                  : "report-quantity quantity-out"
                              }
                            >
                              {record.type ===
                              "Stock In"
                                ? "+"
                                : "-"}
                              {
                                record.quantity
                              }
                            </span>
                          </td>

                          <td>
                            {
                              record.date
                            }
                          </td>

                          <td>
                            {
                              record.reference
                            }
                          </td>

                          <td>
                            {
                              record.party
                            }
                          </td>
                        </tr>
                      )
                    )}

                    {filteredData.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="reports-empty-message"
                        >
                          No report
                          records found.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="reports-footer">
            <span>
              Showing{" "}
              {
                filteredData.length
              }{" "}
              of{" "}
              {
                transactions.length
              }{" "}
              records
            </span>
          </div>
        </div>

        <aside className="low-stock-report">
          <div className="low-stock-report-header">
            <div>
              <h3>
                Low Stock Report
              </h3>

              <p>
                Items requiring
                attention
              </p>
            </div>

            <span>
              {
                lowStockItems.length
              }
            </span>
          </div>

          <div className="low-stock-report-list">
            {lowStockItems.map(
              (item) => (
                <article
                  className="low-stock-report-item"
                  key={
                    item.id ||
                    item.code
                  }
                >
                  <div>
                    <strong>
                      {
                        item.item
                      }
                    </strong>

                    <span>
                      {
                        item.category
                      }
                    </span>
                  </div>

                  <div className="low-stock-values">
                    <strong>
                      {
                        item.quantity
                      }
                    </strong>

                    <span>
                      Min:{" "}
                      {
                        item.minimumLevel
                      }
                    </span>
                  </div>
                </article>
              )
            )}

            {lowStockItems.length ===
              0 && (
              <div className="reports-low-stock-empty">
                No low-stock
                items.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Reports;