import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import itemService from "../../services/itemService";
import requestService from "../../services/requestService";

import "./CreateRequest.css";

function CreateRequest() {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] =
    useState([]);

  const [formData, setFormData] =
    useState({
      itemCode: "",
      quantity: "",
      reason: "",
    });

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const selectedItemFromPage =
    location.state?.selectedItem ||
    null;

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await itemService.getAllItems();

        const itemList =
          Array.isArray(response)
            ? response
            : Array.isArray(
                  response.items
                )
              ? response.items
              : Array.isArray(
                    response.data
                  )
                ? response.data
                : [];

        const formattedItems =
          itemList.map((item) => ({
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

            category:
              item.category_name ??
              item.category ??
              "",

            supplier:
              item.supplier_name ??
              item.supplier ??
              "",

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

            status:
              item.status ||
              "Active",
          }));

        setItems(
          formattedItems.filter(
            (item) =>
              item.status !==
              "Inactive"
          )
        );
      } catch (error) {
        setItems([]);

        setErrorMessage(
          error.message ||
            "Failed to load items."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (
      !selectedItemFromPage
    ) {
      return;
    }

    setFormData(
      (previousData) => ({
        ...previousData,

        itemCode:
          selectedItemFromPage.code ||
          "",
      })
    );
  }, [selectedItemFromPage]);

  const selectedItem =
    useMemo(() => {
      return (
        items.find(
          (item) =>
            item.code ===
            formData.itemCode
        ) || null
      );
    }, [
      items,
      formData.itemCode,
    ]);

  const getStockStatus = (
    item
  ) => {
    if (!item) {
      return "Out of Stock";
    }

    const quantity = Number(
      item.quantity || 0
    );

    const reorderLevel =
      Number(
        item.reorderLevel || 10
      );

    if (quantity === 0) {
      return "Out of Stock";
    }

    if (
      quantity <= reorderLevel
    ) {
      return "Low Stock";
    }

    return "Available";
  };

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setErrorMessage("");

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const clearForm = () => {
    setFormData({
      itemCode: "",
      quantity: "",
      reason: "",
    });

    setErrorMessage("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedItem) {
      setErrorMessage(
        "Please select an item before submitting."
      );

      return;
    }

    const availableQuantity =
      Number(
        selectedItem.quantity ||
          0
      );

    if (
      availableQuantity <= 0
    ) {
      setErrorMessage(
        "This item is currently out of stock."
      );

      return;
    }

    const requestQuantity =
      Number(
        formData.quantity
      );

    if (
      !Number.isInteger(
        requestQuantity
      ) ||
      requestQuantity <= 0
    ) {
      setErrorMessage(
        "Please enter a valid whole-number quantity."
      );

      return;
    }

    if (
      requestQuantity >
      availableQuantity
    ) {
      setErrorMessage(
        `Only ${availableQuantity} items are currently available.`
      );

      return;
    }

    const cleanedReason =
      formData.reason.trim();

    if (
      cleanedReason.length < 5
    ) {
      setErrorMessage(
        "Please enter a clear reason with at least 5 characters."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await requestService.createRequest({
        itemId:
          selectedItem.id,

        quantity:
          requestQuantity,

        reason:
          cleanedReason,
      });

      window.alert(
        "Your stock request was submitted successfully."
      );

      navigate(
        "/user/my-requests",
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to submit request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-request-page">
      <div className="create-request-heading">
        <div>
          <h2>
            Create Request
          </h2>

          <p>
            Submit a new request
            for an office stock
            item.
          </p>
        </div>

        <span className="create-request-status">
          New Request
        </span>
      </div>

      <div className="create-request-content">
        <form
          className="create-request-form-card"
          onSubmit={
            handleSubmit
          }
        >
          <div className="create-request-card-header">
            <div>
              <h3>
                Request Information
              </h3>

              <p>
                Select an item
                and enter the
                required quantity.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="request-error-message">
              {errorMessage}
            </div>
          )}

          <div className="create-request-form-group">
            <label htmlFor="itemCode">
              Select Item
            </label>

            <select
              id="itemCode"
              name="itemCode"
              value={
                formData.itemCode
              }
              onChange={
                handleInputChange
              }
              disabled={
                isLoading
              }
              required
            >
              <option value="">
                {isLoading
                  ? "Loading items..."
                  : "Select an available item"}
              </option>

              {items.map(
                (item) => {
                  const quantity =
                    Number(
                      item.quantity ||
                        0
                    );

                  return (
                    <option
                      key={
                        item.id ||
                        item.code
                      }
                      value={
                        item.code
                      }
                      disabled={
                        quantity ===
                        0
                      }
                    >
                      {item.code} -{" "}
                      {item.name}
                      {quantity ===
                      0
                        ? " (Out of Stock)"
                        : ` (${quantity} available)`}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          <div className="selected-item-details">
            <div>
              <span>
                Item Name
              </span>

              <strong>
                {selectedItem
                  ? selectedItem.name
                  : "Not selected"}
              </strong>
            </div>

            <div>
              <span>
                Category
              </span>

              <strong>
                {selectedItem
                  ? selectedItem.category
                  : "Not selected"}
              </strong>
            </div>

            <div>
              <span>
                Available Quantity
              </span>

              <strong
                className={
                  selectedItem &&
                  Number(
                    selectedItem.quantity
                  ) <=
                    Number(
                      selectedItem.reorderLevel ||
                        10
                    )
                    ? "selected-stock low"
                    : "selected-stock"
                }
              >
                {selectedItem
                  ? selectedItem.quantity
                  : "0"}
              </strong>
            </div>

            <div>
              <span>
                Stock Status
              </span>

              {selectedItem ? (
                <strong>
                  <span
                    className={
                      getStockStatus(
                        selectedItem
                      ) ===
                      "Available"
                        ? "selected-item-status available"
                        : getStockStatus(
                              selectedItem
                            ) ===
                            "Low Stock"
                          ? "selected-item-status low-stock"
                          : "selected-item-status low-stock"
                    }
                  >
                    {getStockStatus(
                      selectedItem
                    )}
                  </span>
                </strong>
              ) : (
                <strong>
                  Not selected
                </strong>
              )}
            </div>
          </div>

          <div className="create-request-form-group">
            <label htmlFor="quantity">
              Request Quantity
            </label>

            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              max={
                selectedItem
                  ? Number(
                      selectedItem.quantity
                    )
                  : undefined
              }
              placeholder="Enter required quantity"
              value={
                formData.quantity
              }
              onChange={
                handleInputChange
              }
              disabled={
                !selectedItem ||
                Number(
                  selectedItem.quantity
                ) === 0
              }
              required
            />

            {selectedItem && (
              <small>
                Maximum available
                quantity:{" "}
                {
                  selectedItem.quantity
                }
              </small>
            )}
          </div>

          <div className="create-request-form-group">
            <label htmlFor="reason">
              Reason for Request
            </label>

            <textarea
              id="reason"
              name="reason"
              rows="5"
              placeholder="Explain why you need this item..."
              value={
                formData.reason
              }
              onChange={
                handleInputChange
              }
              required
            />
          </div>

          <div className="create-request-actions">
            <button
              type="button"
              className="clear-request-button"
              onClick={
                clearForm
              }
              disabled={
                isSubmitting
              }
            >
              Clear
            </button>

            <button
              type="submit"
              className="submit-request-button"
              disabled={
                isSubmitting ||
                !selectedItem ||
                Number(
                  selectedItem?.quantity ||
                    0
                ) === 0
              }
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit Request"}
            </button>
          </div>
        </form>

        <aside className="request-guidelines-card">
          <div className="request-guidelines-icon">
            📋
          </div>

          <h3>
            Request Guidelines
          </h3>

          <p>
            Please review these
            instructions before
            submitting your
            request.
          </p>

          <div className="request-guideline-list">
            <div>
              <span>1</span>

              <p>
                Select the correct
                office stock item.
              </p>
            </div>

            <div>
              <span>2</span>

              <p>
                The quantity must
                not exceed the
                available stock.
              </p>
            </div>

            <div>
              <span>3</span>

              <p>
                Clearly explain
                why the item is
                required.
              </p>
            </div>

            <div>
              <span>4</span>

              <p>
                The administrator
                will approve or
                reject the request.
              </p>
            </div>
          </div>

          <div className="request-process-box">
            <strong>
              Request Process
            </strong>

            <p>
              Submit → Pending →
              Approved or Rejected
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateRequest;