import {
  useEffect,
  useMemo,
  useState,
} from "react";

import itemService from "../../services/itemService";
import stockInService from "../../services/stockInService";
import authService from "../../services/authService";

import "./StockIn.css";

function StockIn() {
  const getTodayDate = () => {
    return new Date()
      .toISOString()
      .slice(0, 10);
  };

  const getCurrentAdminName = () => {
    const currentUser =
      authService.getCurrentUser();

    return (
      currentUser?.fullName ||
      currentUser?.full_name ||
      currentUser?.username ||
      "Admin User"
    );
  };

  const getEmptyForm = () => ({
    reference: "",
    itemId: "",
    supplierId: "",
    supplierName: "",
    quantity: "",
    date: getTodayDate(),
    receivedBy:
      getCurrentAdminName(),
  });

  const [records, setRecords] =
    useState([]);

  const [
    stockItems,
    setStockItems,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState(getEmptyForm);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

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

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateValue
      ).slice(0, 10);
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        stockResponse,
        itemResponse,
      ] = await Promise.all([
        stockInService.getAllStockIn(),
        itemService.getAllItems(),
      ]);

      const stockList =
        Array.isArray(stockResponse)
          ? stockResponse
          : Array.isArray(
                stockResponse.stockInRecords
              )
            ? stockResponse.stockInRecords
            : Array.isArray(
                  stockResponse.data
                )
              ? stockResponse.data
              : [];

      const itemList =
        Array.isArray(itemResponse)
          ? itemResponse
          : Array.isArray(
                itemResponse.items
              )
            ? itemResponse.items
            : Array.isArray(
                  itemResponse.data
                )
              ? itemResponse.data
              : [];

      const formattedRecords =
        stockList.map(
          (record) => ({
            databaseId:
              record.stock_in_id ??
              record.id,

            id:
              record.stock_in_code ??
              record.stockInCode ??
              `STI-${
                record.stock_in_id ??
                record.id
              }`,

            reference:
              record.reference_number ??
              record.referenceNumber ??
              record.reference ??
              "N/A",

            itemCode:
              record.item_code ??
              record.itemCode ??
              "",

            item:
              record.item_name ??
              record.item ??
              "Unknown Item",

            supplierCode:
              record.supplier_code ??
              "",

            supplier:
              record.supplier_name ??
              record.supplier ??
              "Unknown Supplier",

            quantity:
              Number(
                record.quantity || 0
              ),

            date:
              record.received_date ??
              record.date ??
              record.created_at ??
              "",

            receivedBy:
              record.received_by_name ??
              record.receivedBy ??
              record.received_by ??
              "Admin User",

            note:
              record.note || "",
          })
        );

      const formattedItems =
        itemList.map(
          (item) => ({
            id:
              item.item_id ??
              item.id,

            code:
              item.item_code ??
              item.code ??
              "",

            name:
              item.item_name ??
              item.name ??
              "",

            quantity:
              Number(
                item.quantity || 0
              ),

            supplierId:
              item.supplier_id ??
              item.supplierId ??
              null,

            supplier:
              item.supplier_name ??
              item.supplier ??
              "",

            status:
              item.status ||
              "Active",
          })
        );

      setRecords(
        formattedRecords
      );

      setStockItems(
        formattedItems.filter(
          (item) =>
            item.status !==
            "Inactive"
        )
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to load stock-in data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords =
    useMemo(() => {
      return records.filter(
        (record) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          return (
            String(
              record.id || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.reference || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.item || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.supplier || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              record.receivedBy ||
                ""
            )
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      records,
      searchTerm,
    ]);

  const openModal = () => {
    setFormData(
      getEmptyForm()
    );

    setErrorMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setFormData(
      getEmptyForm()
    );
  };

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setErrorMessage("");

    if (
      name === "itemId"
    ) {
      const selectedItem =
        stockItems.find(
          (item) =>
            String(item.id) ===
            String(value)
        );

      setFormData(
        (previousData) => ({
          ...previousData,

          itemId: value,

          supplierId:
            selectedItem
              ?.supplierId ||
            "",

          supplierName:
            selectedItem
              ?.supplier ||
            "",
        })
      );

      return;
    }

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const reference =
      formData.reference.trim();

    const quantity =
      Number(
        formData.quantity
      );

    if (
      !reference ||
      !formData.itemId ||
      !formData.supplierId ||
      !formData.date
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      setErrorMessage(
        "Quantity must be a whole number greater than zero."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await stockInService.createStockIn(
        {
          itemId: Number(
            formData.itemId
          ),

          supplierId: Number(
            formData.supplierId
          ),

          quantity,

          referenceNumber:
            reference,

          receivedDate:
            formData.date,
        }
      );

      window.alert(
        "Stock-in record saved successfully."
      );

      setIsModalOpen(false);

      setFormData(
        getEmptyForm()
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to save stock-in record."
      );

      window.alert(
        error.message ||
          "Failed to save stock-in record."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="stock-in-page">
      <div className="stock-in-heading">
        <div>
          <h2>
            Stock In Management
          </h2>

          <p>
            Record and manage
            incoming office stock.
          </p>
        </div>

        <button
          type="button"
          className="add-stock-button"
          onClick={openModal}
        >
          + Add Stock In
        </button>
      </div>

      <div className="stock-in-panel">
        {errorMessage &&
          !isModalOpen && (
            <div className="stock-empty-message">
              {errorMessage}
            </div>
          )}

        <div className="stock-in-toolbar">
          <input
            type="text"
            placeholder="Search by reference, item or supplier..."
            value={
              searchTerm
            }
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>

        <div className="stock-in-table-wrapper">
          <table className="stock-in-table">
            <thead>
              <tr>
                <th>
                  Stock In ID
                </th>

                <th>
                  Reference No.
                </th>

                <th>
                  Item
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Date
                </th>

                <th>
                  Received By
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="stock-empty-message"
                  >
                    Loading
                    stock-in
                    records...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.databaseId ||
                          record.id
                        }
                      >
                        <td>
                          {
                            record.id
                          }
                        </td>

                        <td>
                          {
                            record.reference
                          }
                        </td>

                        <td className="stock-item-name">
                          {
                            record.item
                          }
                        </td>

                        <td>
                          {
                            record.supplier
                          }
                        </td>

                        <td>
                          <span className="quantity-badge">
                            +
                            {
                              record.quantity
                            }
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            record.date
                          )}
                        </td>

                        <td>
                          {
                            record.receivedBy
                          }
                        </td>
                      </tr>
                    )
                  )}

                  {filteredRecords.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="7"
                          className="stock-empty-message"
                        >
                          No stock-in
                          records found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="stock-in-footer">
          <span>
            Showing{" "}
            {
              filteredRecords.length
            }{" "}
            of {records.length}{" "}
            records
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="stock-modal-overlay"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="stock-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="stock-modal-header">
              <div>
                <h3>
                  Add Stock In
                </h3>

                <p>
                  Enter the
                  incoming stock
                  details.
                </p>
              </div>

              <button
                type="button"
                className="stock-modal-close"
                onClick={
                  closeModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="stock-empty-message">
                {errorMessage}
              </div>
            )}

            <form
              className="stock-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="stock-form-row">
                <div className="stock-form-group">
                  <label>
                    Stock In ID
                  </label>

                  <input
                    type="text"
                    value="Auto Generated"
                    readOnly
                  />
                </div>

                <div className="stock-form-group">
                  <label htmlFor="reference">
                    Reference
                    Number
                  </label>

                  <input
                    id="reference"
                    name="reference"
                    type="text"
                    placeholder="Example: REF-2026-001"
                    value={
                      formData.reference
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="stock-form-row">
                <div className="stock-form-group">
                  <label htmlFor="stockItem">
                    Item
                  </label>

                  <select
                    id="stockItem"
                    name="itemId"
                    value={
                      formData.itemId
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >
                    <option value="">
                      Select item
                    </option>

                    {stockItems.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.code} -{" "}
                          {item.name} —
                          Current:{" "}
                          {
                            item.quantity
                          }
                        </option>
                      )
                    )}
                  </select>

                  {stockItems.length ===
                    0 && (
                      <small>
                        Add an item
                        first.
                      </small>
                    )}
                </div>

                <div className="stock-form-group">
                  <label htmlFor="stockSupplier">
                    Supplier
                  </label>

                  <input
                    id="stockSupplier"
                    type="text"
                    value={
                      formData.supplierName
                    }
                    placeholder="Select an item first"
                    readOnly
                  />
                </div>
              </div>

              <div className="stock-form-row">
                <div className="stock-form-group">
                  <label htmlFor="stockQuantity">
                    Quantity
                  </label>

                  <input
                    id="stockQuantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>

                <div className="stock-form-group">
                  <label htmlFor="stockDate">
                    Date
                  </label>

                  <input
                    id="stockDate"
                    name="date"
                    type="date"
                    value={
                      formData.date
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="stock-form-group">
                <label htmlFor="receivedBy">
                  Received By
                </label>

                <input
                  id="receivedBy"
                  type="text"
                  value={
                    formData.receivedBy
                  }
                  readOnly
                />
              </div>

              <div className="stock-modal-actions">
                <button
                  type="button"
                  className="stock-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    isSubmitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stock-save-button"
                  disabled={
                    isSubmitting ||
                    stockItems.length ===
                      0
                  }
                >
                  {isSubmitting
                    ? "Saving..."
                    : "Save Stock In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default StockIn;