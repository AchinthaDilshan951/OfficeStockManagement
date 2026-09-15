import {
  useEffect,
  useMemo,
  useState,
} from "react";

import transactionService from "../../services/transactionService";

import "./Transactions.css";

function Transactions() {
  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedType,
    setSelectedType,
  ] = useState("All");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "-";
    }

    if (
      typeof dateValue ===
      "string"
    ) {
      return dateValue.slice(
        0,
        10
      );
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  const loadTransactions =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await transactionService.getAllTransactions();

        const transactionList =
          Array.isArray(response)
            ? response
            : Array.isArray(
                  response?.transactions
                )
              ? response.transactions
              : Array.isArray(
                    response?.data
                  )
                ? response.data
                : [];

        const formattedTransactions =
          transactionList.map(
            (transaction) => {
              const databaseId =
                transaction.transaction_id ??
                transaction.id;

              const transactionCode =
                transaction.transaction_code ??
                transaction.transactionCode ??
                transaction.code ??
                `TRN-${String(
                  databaseId || ""
                ).padStart(
                  3,
                  "0"
                )}`;

              const type =
                transaction.transaction_type ??
                transaction.type ??
                "Unknown";

              const reference =
                transaction.reference_number ??
                transaction.reference ??
                transaction.reference_code ??
                transaction.request_code ??
                transaction.stock_in_code ??
                "N/A";

              let person =
                "N/A";

              if (
                type ===
                "Stock In"
              ) {
                person =
                  transaction.supplier_name ??
                  transaction.person ??
                  "N/A";
              } else if (
                type ===
                "Stock Out"
              ) {
                person =
                  transaction.employee_name ??
                  transaction.person ??
                  "N/A";
              } else {
                person =
                  transaction.person ??
                  transaction.supplier_name ??
                  transaction.employee_name ??
                  "N/A";
              }

              return {
                databaseId,

                id:
                  transactionCode,

                type,

                itemId:
                  transaction.item_id ??
                  transaction.itemId,

                itemCode:
                  transaction.item_code ??
                  transaction.itemCode ??
                  "",

                item:
                  transaction.item_name ??
                  transaction.item ??
                  "Unknown Item",

                category:
                  transaction.category_name ??
                  transaction.category ??
                  "Not Specified",

                quantity:
                  Number(
                    transaction.quantity ||
                      0
                  ),

                reference,

                person,

                date:
                  transaction.transaction_date ??
                  transaction.date ??
                  transaction.created_at ??
                  "",

                handledBy:
                  transaction.handled_by_name ??
                  transaction.handledByName ??
                  transaction.admin_name ??
                  "Admin User",

                handledByCode:
                  transaction.handled_by_code ??
                  "",

                note:
                  transaction.note ??
                  transaction.description ??
                  "",
              };
            }
          );

        setTransactions(
          formattedTransactions
        );
      } catch (error) {
        setTransactions([]);

        setErrorMessage(
          error.message ||
            "Failed to load transactions."
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              transaction.id || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              transaction.item || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              transaction.reference ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              transaction.person ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              transaction.handledBy ||
                ""
            )
              .toLowerCase()
              .includes(search);

          const matchesType =
            selectedType ===
              "All" ||
            transaction.type ===
              selectedType;

          const matchesDate =
            selectedDate ===
              "" ||
            formatDate(
              transaction.date
            ) === selectedDate;

          return (
            matchesSearch &&
            matchesType &&
            matchesDate
          );
        }
      );
    }, [
      transactions,
      searchTerm,
      selectedType,
      selectedDate,
    ]);

  const openDetailsModal = (
    transaction
  ) => {
    setSelectedTransaction(
      transaction
    );
  };

  const closeDetailsModal =
    () => {
      setSelectedTransaction(
        null
      );
    };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("All");
    setSelectedDate("");
  };

  const getTransactionTypeClass = (
    type
  ) => {
    return type ===
      "Stock In"
      ? "transaction-type stock-in"
      : "transaction-type stock-out";
  };

  const getQuantityClass = (
    type
  ) => {
    return type ===
      "Stock In"
      ? "transaction-quantity quantity-in"
      : "transaction-quantity quantity-out";
  };

  const getQuantityPrefix = (
    type
  ) => {
    return type ===
      "Stock In"
      ? "+"
      : "-";
  };

  return (
    <section className="transactions-page">
      <div className="transactions-heading">
        <div>
          <h2>
            Transactions Management
          </h2>

          <p>
            View incoming and
            outgoing stock
            transaction history.
          </p>
        </div>

        <div className="transactions-summary">
          Total:{" "}
          {transactions.length}
        </div>
      </div>

      <div className="transactions-panel">
        {errorMessage && (
          <div className="transactions-empty-message">
            {errorMessage}
          </div>
        )}

        <div className="transactions-toolbar">
          <input
            type="text"
            placeholder="Search by transaction, item, reference or person..."
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
              selectedType
            }
            onChange={(event) =>
              setSelectedType(
                event.target.value
              )
            }
          >
            <option value="All">
              All Types
            </option>

            <option value="Stock In">
              Stock In
            </option>

            <option value="Stock Out">
              Stock Out
            </option>
          </select>

          <input
            className="transaction-date-filter"
            type="date"
            value={
              selectedDate
            }
            onChange={(event) =>
              setSelectedDate(
                event.target.value
              )
            }
          />

          <button
            type="button"
            className="transaction-clear-button"
            onClick={
              clearFilters
            }
          >
            Clear
          </button>
        </div>

        <div className="transactions-table-wrapper">
          <table className="transactions-table">
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
                  Quantity
                </th>

                <th>
                  Reference
                </th>

                <th>
                  Supplier /
                  Employee
                </th>

                <th>
                  Date
                </th>

                <th>
                  Handled By
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="transactions-empty-message"
                  >
                    Loading
                    transactions...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredTransactions.map(
                    (
                      transaction
                    ) => (
                      <tr
                        key={
                          transaction.databaseId ||
                          transaction.id
                        }
                      >
                        <td>
                          {
                            transaction.id
                          }
                        </td>

                        <td>
                          <span
                            className={getTransactionTypeClass(
                              transaction.type
                            )}
                          >
                            {
                              transaction.type
                            }
                          </span>
                        </td>

                        <td className="transaction-item">
                          {
                            transaction.item
                          }
                        </td>

                        <td>
                          <span
                            className={getQuantityClass(
                              transaction.type
                            )}
                          >
                            {getQuantityPrefix(
                              transaction.type
                            )}
                            {
                              transaction.quantity
                            }
                          </span>
                        </td>

                        <td>
                          {
                            transaction.reference
                          }
                        </td>

                        <td>
                          {
                            transaction.person
                          }
                        </td>

                        <td>
                          {formatDate(
                            transaction.date
                          )}
                        </td>

                        <td>
                          {
                            transaction.handledBy
                          }
                        </td>

                        <td>
                          <button
                            type="button"
                            className="transaction-view-button"
                            onClick={() =>
                              openDetailsModal(
                                transaction
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredTransactions.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="9"
                          className="transactions-empty-message"
                        >
                          No transactions
                          found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="transactions-footer">
          <span>
            Showing{" "}
            {
              filteredTransactions.length
            }{" "}
            of{" "}
            {
              transactions.length
            }{" "}
            transactions
          </span>
        </div>
      </div>

      {selectedTransaction && (
        <div
          className="transaction-modal-overlay"
          onMouseDown={
            closeDetailsModal
          }
        >
          <div
            className="transaction-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="transaction-modal-header">
              <div>
                <h3>
                  Transaction Details
                </h3>

                <p>
                  {
                    selectedTransaction.id
                  }
                </p>
              </div>

              <button
                type="button"
                className="transaction-modal-close"
                onClick={
                  closeDetailsModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="transaction-details-grid">
              <div className="transaction-detail">
                <span>
                  Transaction Type
                </span>

                <strong>
                  <span
                    className={getTransactionTypeClass(
                      selectedTransaction.type
                    )}
                  >
                    {
                      selectedTransaction.type
                    }
                  </span>
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Item
                </span>

                <strong>
                  {
                    selectedTransaction.item
                  }
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Quantity
                </span>

                <strong>
                  {getQuantityPrefix(
                    selectedTransaction.type
                  )}
                  {
                    selectedTransaction.quantity
                  }
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Reference
                </span>

                <strong>
                  {
                    selectedTransaction.reference
                  }
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Supplier /
                  Employee
                </span>

                <strong>
                  {
                    selectedTransaction.person
                  }
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Date
                </span>

                <strong>
                  {formatDate(
                    selectedTransaction.date
                  )}
                </strong>
              </div>

              <div className="transaction-detail">
                <span>
                  Handled By
                </span>

                <strong>
                  {
                    selectedTransaction.handledBy
                  }
                </strong>
              </div>

              {selectedTransaction.itemCode && (
                <div className="transaction-detail">
                  <span>
                    Item Code
                  </span>

                  <strong>
                    {
                      selectedTransaction.itemCode
                    }
                  </strong>
                </div>
              )}
            </div>

            <div className="transaction-note">
              <span>
                Note
              </span>

              <p>
                {selectedTransaction.note ||
                  "No note available."}
              </p>
            </div>

            <div className="transaction-modal-actions">
              <button
                type="button"
                className="transaction-close-button"
                onClick={
                  closeDetailsModal
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Transactions;