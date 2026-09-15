import {
  useEffect,
  useMemo,
  useState,
} from "react";

import supplierService from "../../services/supplierService";

import "./Suppliers.css";

function Suppliers() {
  const emptyForm = {
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
  };

  const [
    suppliers,
    setSuppliers,
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

  const normalizeSupplier = (
    supplier
  ) => ({
    id:
      supplier.supplier_id ??
      supplier.id,

    code:
      supplier.supplier_code ??
      supplier.code ??
      "",

    name:
      supplier.supplier_name ??
      supplier.name ??
      "",

    contactPerson:
      supplier.contact_person ??
      supplier.contactPerson ??
      "",

    phone:
      supplier.phone ??
      "",

    email:
      supplier.email ??
      "",

    address:
      supplier.address ??
      "",

    status:
      supplier.status ??
      "Active",
  });

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response =
        await supplierService.getAllSuppliers();

      const supplierList =
        Array.isArray(response)
          ? response
          : Array.isArray(
                response.suppliers
              )
            ? response.suppliers
            : Array.isArray(
                  response.data
                )
              ? response.data
              : [];

      setSuppliers(
        supplierList.map(
          normalizeSupplier
        )
      );
    } catch (error) {
      setSuppliers([]);

      setErrorMessage(
        error.message ||
          "Failed to load suppliers."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers =
    useMemo(() => {
      return suppliers.filter(
        (supplier) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          return (
            String(
              supplier.code || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.name || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.contactPerson ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.phone || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.email || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.address || ""
            )
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      suppliers,
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
    supplier
  ) => {
    setEditingId(
      supplier.id
    );

    setFormData({
      code:
        supplier.code,

      name:
        supplier.name,

      contactPerson:
        supplier.contactPerson,

      phone:
        supplier.phone,

      email:
        supplier.email,

      address:
        supplier.address,

      status:
        supplier.status,
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
    setFormData(emptyForm);
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

    const supplierName =
      formData.name.trim();

    const contactPerson =
      formData.contactPerson.trim();

    const phone =
      formData.phone.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const address =
      formData.address.trim();

    if (
      !supplierName ||
      !contactPerson ||
      !phone ||
      !email ||
      !address
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email)
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );

      return;
    }

    const phonePattern =
      /^[0-9+\-\s]{7,15}$/;

    if (
      !phonePattern.test(phone)
    ) {
      setErrorMessage(
        "Please enter a valid phone number."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const supplierData = {
        supplierName,
        contactPerson,
        phone,
        email,
        address,
        status:
          formData.status,
      };

      if (editingId) {
        await supplierService.updateSupplier(
          editingId,
          supplierData
        );

        window.alert(
          "Supplier updated successfully."
        );
      } else {
        await supplierService.createSupplier(
          supplierData
        );

        window.alert(
          "Supplier added successfully."
        );
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);

      await loadSuppliers();
    } catch (error) {
      const message =
        error.message ||
        "Failed to save supplier.";

      setErrorMessage(message);

      window.alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    supplier
  ) => {
    const shouldDelete =
      window.confirm(
        `Are you sure you want to delete ${supplier.name}?`
      );

    if (!shouldDelete) {
      return;
    }

    try {
      await supplierService.deleteSupplier(
        supplier.id
      );

      window.alert(
        "Supplier deleted successfully."
      );

      await loadSuppliers();
    } catch (error) {
      window.alert(
        error.message ||
          "Failed to delete supplier."
      );
    }
  };

  return (
    <section className="suppliers-page">
      <div className="suppliers-heading">
        <div>
          <h2>
            Suppliers Management
          </h2>

          <p>
            Manage supplier information
            and contact details.
          </p>
        </div>

        <button
          type="button"
          className="add-supplier-button"
          onClick={openAddModal}
        >
          + Add Supplier
        </button>
      </div>

      <div className="suppliers-panel">
        {errorMessage &&
          !isModalOpen && (
            <div className="suppliers-empty-message">
              {errorMessage}
            </div>
          )}

        <div className="suppliers-toolbar">
          <input
            type="text"
            placeholder="Search by supplier, contact, phone or email..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>

        <div className="suppliers-table-wrapper">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>
                  Supplier ID
                </th>

                <th>
                  Supplier Name
                </th>

                <th>
                  Contact Person
                </th>

                <th>
                  Phone
                </th>

                <th>
                  Email
                </th>

                <th>
                  Address
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
                    colSpan="8"
                    className="suppliers-empty-message"
                  >
                    Loading suppliers...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredSuppliers.map(
                    (supplier) => (
                      <tr
                        key={
                          supplier.id ||
                          supplier.code
                        }
                      >
                        <td>
                          {
                            supplier.code
                          }
                        </td>

                        <td className="supplier-name">
                          {
                            supplier.name
                          }
                        </td>

                        <td>
                          {
                            supplier.contactPerson
                          }
                        </td>

                        <td>
                          {
                            supplier.phone
                          }
                        </td>

                        <td>
                          {
                            supplier.email
                          }
                        </td>

                        <td>
                          {
                            supplier.address
                          }
                        </td>

                        <td>
                          <span
                            className={
                              supplier.status ===
                              "Active"
                                ? "supplier-status active"
                                : "supplier-status inactive"
                            }
                          >
                            {
                              supplier.status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="supplier-action-buttons">
                            <button
                              type="button"
                              className="supplier-edit-button"
                              onClick={() =>
                                openEditModal(
                                  supplier
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="supplier-delete-button"
                              onClick={() =>
                                handleDelete(
                                  supplier
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

                  {filteredSuppliers.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="8"
                          className="suppliers-empty-message"
                        >
                          No suppliers found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="suppliers-footer">
          <span>
            Showing{" "}
            {
              filteredSuppliers.length
            }{" "}
            of{" "}
            {suppliers.length}{" "}
            suppliers
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="supplier-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="supplier-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="supplier-modal-header">
              <div>
                <h3>
                  {editingId
                    ? "Edit Supplier"
                    : "Add New Supplier"}
                </h3>

                <p>
                  {editingId
                    ? "Update the selected supplier details."
                    : "Enter the details for the new supplier."}
                </p>
              </div>

              <button
                type="button"
                className="supplier-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="suppliers-empty-message">
                {errorMessage}
              </div>
            )}

            <form
              className="supplier-form"
              onSubmit={handleSubmit}
            >
              <div className="supplier-form-row">
                <div className="supplier-form-group">
                  <label htmlFor="supplierId">
                    Supplier ID
                  </label>

                  <input
                    id="supplierId"
                    type="text"
                    value={
                      formData.code
                    }
                    readOnly
                  />
                </div>

                <div className="supplier-form-group">
                  <label htmlFor="supplierName">
                    Supplier Name
                  </label>

                  <input
                    id="supplierName"
                    name="name"
                    type="text"
                    placeholder="Enter supplier name"
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

              <div className="supplier-form-row">
                <div className="supplier-form-group">
                  <label htmlFor="contactPerson">
                    Contact Person
                  </label>

                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    placeholder="Enter contact person"
                    value={
                      formData.contactPerson
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label htmlFor="supplierPhone">
                    Phone Number
                  </label>

                  <input
                    id="supplierPhone"
                    name="phone"
                    type="tel"
                    placeholder="Example: 0771234567"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="supplier-form-row">
                <div className="supplier-form-group">
                  <label htmlFor="supplierEmail">
                    Email Address
                  </label>

                  <input
                    id="supplierEmail"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={
                      formData.email
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label htmlFor="supplierStatus">
                    Status
                  </label>

                  <select
                    id="supplierStatus"
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
              </div>

              <div className="supplier-form-group">
                <label htmlFor="supplierAddress">
                  Address
                </label>

                <textarea
                  id="supplierAddress"
                  name="address"
                  placeholder="Enter supplier address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="3"
                  required
                />
              </div>

              <div className="supplier-modal-actions">
                <button
                  type="button"
                  className="supplier-cancel-button"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="supplier-save-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update Supplier"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Suppliers;