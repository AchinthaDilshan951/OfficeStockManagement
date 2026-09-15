import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import itemService from "../../services/itemService";

import "./AvailableItems.css";

function AvailableItems() {
  const navigate = useNavigate();

  const [items, setItems] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

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
            : Array.isArray(response.items)
              ? response.items
              : Array.isArray(response.data)
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
              item.unit || "Piece",

            status:
              item.status ||
              "Active",
          }));

        const activeItems =
          formattedItems.filter(
            (item) =>
              item.status !==
              "Inactive"
          );

        setItems(activeItems);
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Failed to load items."
        );

        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  const getDisplayStatus = (
    item
  ) => {
    const quantity = Number(
      item.quantity || 0
    );

    const reorderLevel = Number(
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

  const categoryOptions =
    useMemo(() => {
      return [
        ...new Set(
          items
            .map(
              (item) =>
                item.category
            )
            .filter(Boolean)
        ),
      ];
    }, [items]);

  const filteredItems =
    useMemo(() => {
      return items.filter(
        (item) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              item.code || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              item.name || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              item.category || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesCategory =
            selectedCategory ===
              "All" ||
            item.category ===
              selectedCategory;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      items,
      searchTerm,
      selectedCategory,
    ]);

  const handleRequestItem = (
    item
  ) => {
    const availableQuantity =
      Number(
        item.quantity || 0
      );

    if (
      availableQuantity <= 0
    ) {
      window.alert(
        "This item is currently out of stock."
      );

      return;
    }

    navigate(
      "/user/create-request",
      {
        state: {
          selectedItem: {
            id: item.id,

            code:
              item.code,

            name:
              item.name,

            category:
              item.category,

            supplier:
              item.supplier,

            quantity:
              availableQuantity,

            unit:
              item.unit,

            status:
              getDisplayStatus(
                item
              ),
          },
        },
      }
    );
  };

  return (
    <section className="available-items-page">
      <div className="available-items-heading">
        <div>
          <h2>
            Available Items
          </h2>

          <p>
            Browse office stock
            items currently
            available.
          </p>
        </div>

        <span className="available-items-summary">
          {items.length}{" "}
          {items.length === 1
            ? "Item"
            : "Items"}
        </span>
      </div>

      {errorMessage && (
        <div className="available-items-empty">
          {errorMessage}
        </div>
      )}

      <div className="available-items-panel">
        <div className="available-items-toolbar">
          <input
            type="text"
            placeholder="Search by item code, name or category..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <select
            value={
              selectedCategory
            }
            onChange={(event) =>
              setSelectedCategory(
                event.target.value
              )
            }
          >
            <option value="All">
              All Categories
            </option>

            {categoryOptions.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>
        </div>

        <div className="available-items-table-wrapper">
          <table className="available-items-table">
            <thead>
              <tr>
                <th>
                  Item Code
                </th>

                <th>
                  Item Name
                </th>

                <th>
                  Category
                </th>

                <th>
                  Available Quantity
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="available-items-empty"
                  >
                    Loading items...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredItems.map(
                    (item) => {
                      const quantity =
                        Number(
                          item.quantity ||
                            0
                        );

                      const displayStatus =
                        getDisplayStatus(
                          item
                        );

                      return (
                        <tr
                          key={
                            item.id ||
                            item.code
                          }
                        >
                          <td>
                            {
                              item.code
                            }
                          </td>

                          <td className="available-item-name">
                            {
                              item.name
                            }
                          </td>

                          <td>
                            {
                              item.category
                            }
                          </td>

                          <td>
                            <span className="available-quantity">
                              {
                                quantity
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                displayStatus ===
                                "Available"
                                  ? "available-item-status available"
                                  : displayStatus ===
                                      "Low Stock"
                                    ? "available-item-status low-stock"
                                    : "available-item-status out-of-stock"
                              }
                            >
                              {
                                displayStatus
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="request-item-button"
                              onClick={() =>
                                handleRequestItem(
                                  item
                                )
                              }
                              disabled={
                                quantity <=
                                0
                              }
                            >
                              {quantity <=
                              0
                                ? "Unavailable"
                                : "Request Item"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {filteredItems.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="6"
                          className="available-items-empty"
                        >
                          No items
                          found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="available-items-footer">
          <span>
            Showing{" "}
            {
              filteredItems.length
            }{" "}
            of {items.length} items
          </span>
        </div>
      </div>
    </section>
  );
}

export default AvailableItems;