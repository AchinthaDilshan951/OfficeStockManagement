import {
  useEffect,
  useMemo,
  useState,
} from "react";

import itemService from "../../services/itemService";
import categoryService from "../../services/categoryService";
import supplierService from "../../services/supplierService";

import "./Items.css";

function Items() {
  const emptyForm = {
    code: "",
    name: "",
    categoryId: "",
    supplierId: "",
    quantity: "",
    reorderLevel: "10",
    unit: "Piece",
  };

  const [items, setItems] =
    useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    suppliers,
    setSuppliers,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const getDisplayStatus = (
    quantity,
    reorderLevel = 10
  ) => {
    const quantityNumber =
      Number(quantity || 0);

    const reorderNumber =
      Number(reorderLevel || 10);

    if (quantityNumber === 0) {
      return "Out of Stock";
    }

    if (
      quantityNumber <=
      reorderNumber
    ) {
      return "Low Stock";
    }

    return "Active";
  };

  const normalizeItem = (
    item
  ) => ({
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

    categoryId:
      item.category_id ??
      item.categoryId ??
      null,

    category:
      item.category_name ??
      item.category ??
      "",

    supplierId:
      item.supplier_id ??
      item.supplierId ??
      null,

    supplier:
      item.supplier_name ??
      item.supplier ??
      "",

    quantity:
      Number(
        item.quantity || 0
      ),

    reorderLevel:
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

  const normalizeCategory = (
    category
  ) => ({
    id:
      category.category_id ??
      category.id,

    name:
      category.category_name ??
      category.name ??
      "",

    status:
      category.status ||
      "Active",
  });

  const normalizeSupplier = (
    supplier
  ) => ({
    id:
      supplier.supplier_id ??
      supplier.id,

    name:
      supplier.supplier_name ??
      supplier.name ??
      "",

    status:
      supplier.status ||
      "Active",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        itemResponse,
        categoryResponse,
        supplierResponse,
      ] = await Promise.all([
        itemService.getAllItems(),
        categoryService.getAllCategories(),
        supplierService.getAllSuppliers(),
      ]);

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

      const categoryList =
        Array.isArray(
          categoryResponse
        )
          ? categoryResponse
          : Array.isArray(
                categoryResponse.categories
              )
            ? categoryResponse.categories
            : Array.isArray(
                  categoryResponse.data
                )
              ? categoryResponse.data
              : [];

      const supplierList =
        Array.isArray(
          supplierResponse
        )
          ? supplierResponse
          : Array.isArray(
                supplierResponse.suppliers
              )
            ? supplierResponse.suppliers
            : Array.isArray(
                  supplierResponse.data
                )
              ? supplierResponse.data
              : [];

      setItems(
        itemList.map(
          normalizeItem
        )
      );

      setCategories(
        categoryList.map(
          normalizeCategory
        )
      );

      setSuppliers(
        supplierList.map(
          normalizeSupplier
        )
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to load item data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          category.status ===
          "Active"
      );
    }, [categories]);

  const activeSuppliers =
    useMemo(() => {
      return suppliers.filter(
        (supplier) =>
          supplier.status ===
          "Active"
      );
    }, [suppliers]);

  const categoryFilterOptions =
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
              .includes(search) ||
            String(
              item.supplier || ""
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

  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      ...emptyForm,
      code: "Auto Generated",
    });

    setErrorMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (
    item
  ) => {
    setEditingId(item.id);

    setFormData({
      code: item.code,

      name: item.name,

      categoryId:
        String(
          item.categoryId ??
            ""
        ),

      supplierId:
        String(
          item.supplierId ??
            ""
        ),

      quantity:
        String(
          item.quantity
        ),

      reorderLevel:
        String(
          item.reorderLevel
        ),

      unit:
        item.unit ||
        "Piece",
    });

    setErrorMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);

    setEditingId(null);

    setFormData(
      emptyForm
    );

    setErrorMessage("");
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

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const itemName =
      formData.name.trim();

    const quantity =
      Number(
        formData.quantity
      );

    const reorderLevel =
      Number(
        formData.reorderLevel
      );

    const categoryId =
      Number(
        formData.categoryId
      );

    const supplierId =
      Number(
        formData.supplierId
      );

    if (
      !itemName ||
      !formData.categoryId ||
      !formData.supplierId ||
      formData.quantity === "" ||
      formData.reorderLevel === ""
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    if (
      !Number.isInteger(
        categoryId
      ) ||
      categoryId <= 0
    ) {
      setErrorMessage(
        "Please select a valid category."
      );

      return;
    }

    if (
      !Number.isInteger(
        supplierId
      ) ||
      supplierId <= 0
    ) {
      setErrorMessage(
        "Please select a valid supplier."
      );

      return;
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 0
    ) {
      setErrorMessage(
        "Quantity must be a valid whole number."
      );

      return;
    }

    if (
      !Number.isInteger(
        reorderLevel
      ) ||
      reorderLevel < 0
    ) {
      setErrorMessage(
        "Reorder level must be a valid whole number."
      );

      return;
    }

    const unit =
      String(
        formData.unit ||
          "Piece"
      ).trim();

    if (!unit) {
      setErrorMessage(
        "Unit is required."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const itemData = {
        itemName,
        categoryId,
        supplierId,
        quantity,
        reorderLevel,
        unit,
        status: "Active",
      };

      if (editingId) {
        await itemService.updateItem(
          editingId,
          itemData
        );

        window.alert(
          "Item updated successfully."
        );
      } else {
        await itemService.createItem(
          itemData
        );

        window.alert(
          "Item added successfully."
        );
      }

      setIsModalOpen(false);

      setEditingId(null);

      setFormData(
        emptyForm
      );

      await loadData();
    } catch (error) {
      const message =
        error.message ||
        "Failed to save item.";

      setErrorMessage(
        message
      );

      window.alert(
        message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    item
  ) => {
    const shouldDelete =
      window.confirm(
        `Are you sure you want to delete ${item.name}?`
      );

    if (!shouldDelete) {
      return;
    }

    try {
      await itemService.deleteItem(
        item.id
      );

      window.alert(
        "Item deleted successfully."
      );

      await loadData();
    } catch (error) {
      window.alert(
        error.message ||
          "Failed to delete item."
      );
    }
  };

  const getStatusClass = (
    status
  ) => {
    if (
      status === "Active"
    ) {
      return "active";
    }

    return "low-stock";
  };

  return (
    <section className="items-page">
      <div className="items-heading">
        <div>
          <h2>
            Items Management
          </h2>

          <p>
            Manage office stock
            items and quantities.
          </p>
        </div>

        <button
          type="button"
          className="add-item-button"
          onClick={openAddModal}
        >
          + Add Item
        </button>
      </div>

      <div className="items-panel">
        {errorMessage &&
          !isModalOpen && (
            <div className="empty-message">
              {errorMessage}
            </div>
          )}

        <div className="items-toolbar">
          <input
            type="text"
            placeholder="Search by code, item, category or supplier..."
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

            {categoryFilterOptions.map(
              (
                categoryName
              ) => (
                <option
                  key={
                    categoryName
                  }
                  value={
                    categoryName
                  }
                >
                  {
                    categoryName
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="items-table-wrapper">
          <table className="items-table">
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
                  Supplier
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Status
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
                    colSpan="7"
                    className="empty-message"
                  >
                    Loading items...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredItems.map(
                    (item) => {
                      const displayStatus =
                        getDisplayStatus(
                          item.quantity,
                          item.reorderLevel
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

                          <td>
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
                            {
                              item.supplier
                            }
                          </td>

                          <td>
                            {
                              item.quantity
                            }
                          </td>

                          <td>
                            <span
                              className={`item-status ${getStatusClass(
                                displayStatus
                              )}`}
                            >
                              {
                                displayStatus
                              }
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() =>
                                  openEditModal(
                                    item
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
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
                          colSpan="7"
                          className="empty-message"
                        >
                          No items found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="items-footer">
          <span>
            Showing{" "}
            {
              filteredItems.length
            }{" "}
            of {items.length} items
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="item-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h3>
                  {editingId
                    ? "Edit Item"
                    : "Add New Item"}
                </h3>

                <p>
                  {editingId
                    ? "Update the selected stock item."
                    : "Enter the new stock item details."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="empty-message">
                {errorMessage}
              </div>
            )}

            <form
              className="item-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-row">
                <div className="item-form-group">
                  <label htmlFor="code">
                    Item Code
                  </label>

                  <input
                    id="code"
                    type="text"
                    value={
                      formData.code
                    }
                    readOnly
                  />
                </div>

                <div className="item-form-group">
                  <label htmlFor="name">
                    Item Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter item name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="item-form-group">
                  <label htmlFor="categoryId">
                    Category
                  </label>

                  <select
                    id="categoryId"
                    name="categoryId"
                    value={
                      formData.categoryId
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {activeCategories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="item-form-group">
                  <label htmlFor="supplierId">
                    Supplier
                  </label>

                  <select
                    id="supplierId"
                    name="supplierId"
                    value={
                      formData.supplierId
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >
                    <option value="">
                      Select supplier
                    </option>

                    {activeSuppliers.map(
                      (
                        supplier
                      ) => (
                        <option
                          key={
                            supplier.id
                          }
                          value={
                            supplier.id
                          }
                        >
                          {
                            supplier.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="item-form-group">
                  <label htmlFor="quantity">
                    Quantity
                  </label>

                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
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

                <div className="item-form-group">
                  <label htmlFor="status">
                    Status
                  </label>

                  <input
                    id="status"
                    type="text"
                    value={
                      formData.quantity ===
                      ""
                        ? "Active"
                        : getDisplayStatus(
                            Number(
                              formData.quantity
                            ),
                            Number(
                              formData.reorderLevel
                            )
                          )
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    isSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-item-button"
                  disabled={
                    isSaving ||
                    activeCategories.length ===
                      0 ||
                    activeSuppliers.length ===
                      0
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update Item"
                      : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Items;