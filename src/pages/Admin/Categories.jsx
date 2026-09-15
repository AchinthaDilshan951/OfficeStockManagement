import {
  useEffect,
  useMemo,
  useState,
} from "react";

import categoryService from "../../services/categoryService";
import itemService from "../../services/itemService";

import "./Categories.css";

function Categories() {
  const emptyForm = {
    code: "",
    name: "",
    description: "",
    status: "Active",
  };

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    items,
    setItems,
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
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

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

  const normalizeCategory = (
    category
  ) => ({
    id:
      category.category_id ??
      category.id,

    code:
      category.category_code ??
      category.categoryCode ??
      category.code ??
      "",

    name:
      category.category_name ??
      category.categoryName ??
      category.name ??
      "",

    description:
      category.description ??
      "",

    status:
      category.status ??
      "Active",
  });

  const normalizeItem = (
    item
  ) => ({
    id:
      item.item_id ??
      item.id,

    categoryId:
      item.category_id ??
      item.categoryId ??
      null,

    category:
      item.category_name ??
      item.category ??
      "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        categoryResponse,
        itemResponse,
      ] = await Promise.all([
        categoryService.getAllCategories(),
        itemService.getAllItems(),
      ]);

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

      const itemList =
        Array.isArray(
          itemResponse
        )
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

      setCategories(
        categoryList.map(
          normalizeCategory
        )
      );

      setItems(
        itemList.map(
          normalizeItem
        )
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to load categories."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoriesWithItemCount =
    useMemo(() => {
      return categories.map(
        (category) => {
          const itemCount =
            items.filter(
              (item) => {
                if (
                  item.categoryId != null &&
                  category.id != null
                ) {
                  return (
                    String(
                      item.categoryId
                    ) ===
                    String(
                      category.id
                    )
                  );
                }

                return (
                  String(
                    item.category || ""
                  )
                    .trim()
                    .toLowerCase() ===
                  String(
                    category.name || ""
                  )
                    .trim()
                    .toLowerCase()
                );
              }
            ).length;

          return {
            ...category,
            itemCount,
          };
        }
      );
    }, [
      categories,
      items,
    ]);

  const filteredCategories =
    useMemo(() => {
      return categoriesWithItemCount.filter(
        (category) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          return (
            String(
              category.code || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              category.name || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              category.description ||
                ""
            )
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      categoriesWithItemCount,
      searchTerm,
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
    category
  ) => {
    setEditingId(
      category.id
    );

    setFormData({
      code:
        category.code,

      name:
        category.name,

      description:
        category.description,

      status:
        category.status,
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

    const categoryName =
      formData.name.trim();

    const description =
      formData.description.trim();

    if (
      !categoryName ||
      !description
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const categoryData = {
        categoryName,
        description,
        status:
          formData.status,
      };

      if (editingId) {
        await categoryService.updateCategory(
          editingId,
          categoryData
        );

        window.alert(
          "Category updated successfully."
        );
      } else {
        await categoryService.createCategory(
          categoryData
        );

        window.alert(
          "Category added successfully."
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
        "Failed to save category.";

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
    category
  ) => {
    const shouldDelete =
      window.confirm(
        `Are you sure you want to delete ${category.name}?`
      );

    if (!shouldDelete) {
      return;
    }

    try {
      await categoryService.deleteCategory(
        category.id
      );

      window.alert(
        "Category deleted successfully."
      );

      await loadData();
    } catch (error) {
      window.alert(
        error.message ||
          "Failed to delete category."
      );
    }
  };

  return (
    <section className="categories-page">
      <div className="categories-heading">
        <div>
          <h2>
            Categories Management
          </h2>

          <p>
            Manage the categories
            used to organize office
            stock items.
          </p>
        </div>

        <button
          type="button"
          className="add-category-button"
          onClick={
            openAddModal
          }
        >
          + Add Category
        </button>
      </div>

      <div className="categories-panel">
        {errorMessage &&
          !isModalOpen && (
            <div className="categories-empty-message">
              {errorMessage}
            </div>
          )}

        <div className="categories-toolbar">
          <input
            type="text"
            placeholder="Search categories..."
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

        <div className="categories-table-wrapper">
          <table className="categories-table">
            <thead>
              <tr>
                <th>
                  Category ID
                </th>

                <th>
                  Category Name
                </th>

                <th>
                  Description
                </th>

                <th>
                  Items
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
                    colSpan="6"
                    className="categories-empty-message"
                  >
                    Loading
                    categories...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={
                          category.id ||
                          category.code
                        }
                      >
                        <td>
                          {category.code ||
                            `CAT-${category.id}`}
                        </td>

                        <td className="category-name">
                          {
                            category.name
                          }
                        </td>

                        <td>
                          {
                            category.description
                          }
                        </td>

                        <td>
                          {
                            category.itemCount
                          }
                        </td>

                        <td>
                          <span
                            className={
                              category.status ===
                              "Active"
                                ? "category-status active"
                                : "category-status inactive"
                            }
                          >
                            {
                              category.status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="category-action-buttons">
                            <button
                              type="button"
                              className="category-edit-button"
                              onClick={() =>
                                openEditModal(
                                  category
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="category-delete-button"
                              onClick={() =>
                                handleDelete(
                                  category
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredCategories.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="6"
                          className="categories-empty-message"
                        >
                          No categories
                          found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="categories-footer">
          <span>
            Showing{" "}
            {
              filteredCategories.length
            }{" "}
            of{" "}
            {
              categories.length
            }{" "}
            categories
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="category-modal-overlay"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="category-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="category-modal-header">
              <div>
                <h3>
                  {editingId
                    ? "Edit Category"
                    : "Add New Category"}
                </h3>

                <p>
                  {editingId
                    ? "Update the selected category details."
                    : "Enter the details for the new category."}
                </p>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={
                  closeModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="categories-empty-message">
                {errorMessage}
              </div>
            )}

            <form
              className="category-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="category-form-group">
                <label htmlFor="categoryId">
                  Category ID
                </label>

                <input
                  id="categoryId"
                  type="text"
                  value={
                    formData.code
                  }
                  readOnly
                />
              </div>

              <div className="category-form-group">
                <label htmlFor="categoryName">
                  Category Name
                </label>

                <input
                  id="categoryName"
                  name="name"
                  type="text"
                  placeholder="Enter category name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                />
              </div>

              <div className="category-form-group">
                <label htmlFor="categoryDescription">
                  Description
                </label>

                <textarea
                  id="categoryDescription"
                  name="description"
                  placeholder="Enter category description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="4"
                  required
                />
              </div>

              <div className="category-form-group">
                <label htmlFor="categoryStatus">
                  Status
                </label>

                <select
                  id="categoryStatus"
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleInputChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="category-modal-actions">
                <button
                  type="button"
                  className="category-cancel-button"
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
                  className="category-save-button"
                  disabled={
                    isSaving
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update Category"
                      : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Categories;