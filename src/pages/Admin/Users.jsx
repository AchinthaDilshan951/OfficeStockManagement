import {
  useEffect,
  useMemo,
  useState,
} from "react";

import userService from "../../services/userService";
import authService from "../../services/authService";

import "./Users.css";

function Users() {
  const emptyForm = {
    code: "",
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    department: "",
    role: "User",
    status: "Active",
  };

  const [users, setUsers] =
    useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedRole,
    setSelectedRole,
  ] = useState("All");

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
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const normalizeUser = (
    user
  ) => ({
    id:
      user.user_id ??
      user.userId ??
      user.id,

    code:
      user.user_code ??
      user.userCode ??
      "",

    fullName:
      user.full_name ??
      user.fullName ??
      user.name ??
      "Unknown User",

    username:
      user.username ??
      "",

    email:
      user.email ??
      "",

    phone:
      user.phone ??
      "",

    department:
      user.department ??
      "Not Specified",

    role:
      user.role ??
      "User",

    status:
      user.status ??
      "Active",
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response =
        await userService.getAllUsers();

      const userList =
        Array.isArray(response)
          ? response
          : Array.isArray(
                response.users
              )
            ? response.users
            : Array.isArray(
                  response.data
                )
              ? response.data
              : [];

      setUsers(
        userList.map(
          normalizeUser
        )
      );
    } catch (error) {
      setUsers([]);

      setErrorMessage(
        error.message ||
          "Failed to load users."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers =
    useMemo(() => {
      return users.filter(
        (user) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              user.code || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              user.fullName || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              user.username || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              user.email || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              user.department || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesRole =
            selectedRole ===
              "All" ||
            user.role ===
              selectedRole;

          return (
            matchesSearch &&
            matchesRole
          );
        }
      );
    }, [
      users,
      searchTerm,
      selectedRole,
    ]);

  const getCurrentUser = () => {
    return (
      authService.getCurrentUser() ||
      null
    );
  };

  const getCurrentUserId = () => {
    const currentUser =
      getCurrentUser();

    return (
      currentUser?.user_id ??
      currentUser?.userId ??
      currentUser?.id ??
      null
    );
  };

  const isCurrentUser = (
    user
  ) => {
    const currentUserId =
      getCurrentUserId();

    if (
      currentUserId == null ||
      user?.id == null
    ) {
      return false;
    }

    return (
      String(currentUserId) ===
      String(user.id)
    );
  };

  const updateStoredCurrentUser = (
    updatedUser
  ) => {
    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      return;
    }

    const currentUserId =
      currentUser.user_id ??
      currentUser.userId ??
      currentUser.id;

    if (
      String(currentUserId) !==
      String(updatedUser.id)
    ) {
      return;
    }

    const updatedStoredUser = {
      ...currentUser,

      user_id:
        currentUser.user_id ??
        updatedUser.id,

      id:
        currentUser.id ??
        updatedUser.id,

      user_code:
        updatedUser.code,

      full_name:
        updatedUser.fullName,

      fullName:
        updatedUser.fullName,

      username:
        updatedUser.username,

      email:
        updatedUser.email,

      phone:
        updatedUser.phone,

      department:
        updatedUser.department,

      role:
        updatedUser.role,

      status:
        updatedUser.status,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(
        updatedStoredUser
      )
    );
  };

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
    user
  ) => {
    setEditingId(user.id);

    setFormData({
      code:
        user.code,

      fullName:
        user.fullName,

      username:
        user.username,

      email:
        user.email,

      phone:
        user.phone,

      password: "",

      department:
        user.department,

      role:
        user.role,

      status:
        user.status,
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

  const validateForm = () => {
    const fullName =
      formData.fullName.trim();

    const username =
      formData.username.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const phone =
      formData.phone.trim();

    if (
      !fullName ||
      !username ||
      !email ||
      !phone ||
      !formData.department
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return false;
    }

    if (
      fullName.length < 3
    ) {
      setErrorMessage(
        "Full name must contain at least 3 characters."
      );

      return false;
    }

    if (
      username.length < 3
    ) {
      setErrorMessage(
        "Username must contain at least 3 characters."
      );

      return false;
    }

    const usernamePattern =
      /^[a-zA-Z0-9_]+$/;

    if (
      !usernamePattern.test(
        username
      )
    ) {
      setErrorMessage(
        "Username can only contain letters, numbers and underscores."
      );

      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email)
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );

      return false;
    }

    const phonePattern =
      /^[0-9+\-\s]{7,15}$/;

    if (
      !phonePattern.test(phone)
    ) {
      setErrorMessage(
        "Please enter a valid phone number."
      );

      return false;
    }

    if (
      !editingId &&
      formData.password.length < 6
    ) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const fullName =
      formData.fullName.trim();

    const username =
      formData.username
        .trim()
        .toLowerCase();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const phone =
      formData.phone.trim();

    const department =
      formData.department.trim();

    try {
      setIsSaving(true);
      setErrorMessage("");

      if (editingId) {
        const originalUser =
          users.find(
            (user) =>
              String(user.id) ===
              String(editingId)
          );

        const detailResponse =
          await userService.updateUser(
            editingId,
            {
              fullName,
              username,
              email,
              phone,
              department,
            }
          );

        let latestUser =
          normalizeUser(
            detailResponse?.user ||
              {
                ...originalUser,
                fullName,
                username,
                email,
                phone,
                department,
              }
          );

        if (
          originalUser &&
          originalUser.role !==
            formData.role
        ) {
          const roleResponse =
            await userService.updateUserRole(
              editingId,
              formData.role
            );

          latestUser =
            normalizeUser(
              roleResponse?.user ||
                {
                  ...latestUser,
                  role:
                    formData.role,
                }
            );
        }

        if (
          originalUser &&
          originalUser.status !==
            formData.status
        ) {
          const statusResponse =
            await userService.updateUserStatus(
              editingId,
              formData.status
            );

          latestUser =
            normalizeUser(
              statusResponse?.user ||
                {
                  ...latestUser,
                  status:
                    formData.status,
                }
            );
        }

        updateStoredCurrentUser(
          latestUser
        );

        window.alert(
          "User updated successfully."
        );
      } else {
        const registerResponse =
          await authService.register({
            fullName,
            username,
            email,
            phone,
            department,
            password:
              formData.password,
          });

        let createdUserId =
          registerResponse?.user
            ?.user_id ??
          registerResponse?.user
            ?.userId ??
          registerResponse?.user?.id ??
          null;

        if (
          createdUserId == null
        ) {
          const usersResponse =
            await userService.getAllUsers();

          const refreshedList =
            Array.isArray(
              usersResponse
            )
              ? usersResponse
              : Array.isArray(
                    usersResponse.users
                  )
                ? usersResponse.users
                : [];

          const createdUser =
            refreshedList.find(
              (user) =>
                String(
                  user.username ||
                    ""
                )
                  .trim()
                  .toLowerCase() ===
                username
            );

          createdUserId =
            createdUser?.user_id ??
            createdUser?.userId ??
            createdUser?.id ??
            null;
        }

        if (
          createdUserId != null &&
          formData.role !== "User"
        ) {
          await userService.updateUserRole(
            createdUserId,
            formData.role
          );
        }

        if (
          createdUserId != null &&
          formData.status !==
            "Active"
        ) {
          await userService.updateUserStatus(
            createdUserId,
            formData.status
          );
        }

        window.alert(
          "User added successfully."
        );
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);

      await loadUsers();
    } catch (error) {
      const message =
        error.message ||
        "Failed to save user.";

      setErrorMessage(message);

      window.alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (
    user
  ) => {
    if (
      isCurrentUser(user) &&
      user.status === "Active"
    ) {
      window.alert(
        "You cannot deactivate your own account."
      );

      return;
    }

    const newStatus =
      user.status === "Active"
        ? "Inactive"
        : "Active";

    const action =
      newStatus === "Active"
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${user.fullName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        user.id
      );

      await userService.updateUserStatus(
        user.id,
        newStatus
      );

      await loadUsers();
    } catch (error) {
      window.alert(
        error.message ||
          "Failed to update user status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="users-page">
      <div className="users-heading">
        <div>
          <h2>
            Users Management
          </h2>

          <p>
            Manage system users,
            roles and account status.
          </p>
        </div>

        <button
          type="button"
          className="add-user-button"
          onClick={openAddModal}
        >
          + Add User
        </button>
      </div>

      <div className="users-panel">
        {errorMessage &&
          !isModalOpen && (
            <div className="users-empty-message">
              {errorMessage}
            </div>
          )}

        <div className="users-toolbar">
          <input
            type="text"
            placeholder="Search by name, username, email or department..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <select
            value={selectedRole}
            onChange={(event) =>
              setSelectedRole(
                event.target.value
              )
            }
          >
            <option value="All">
              All Roles
            </option>

            <option value="Admin">
              Admin
            </option>

            <option value="User">
              User
            </option>
          </select>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="users-empty-message"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.id ||
                          user.code
                        }
                      >
                        <td>
                          {
                            user.code
                          }
                        </td>

                        <td className="user-full-name">
                          {
                            user.fullName
                          }
                        </td>

                        <td>
                          {
                            user.username
                          }
                        </td>

                        <td>
                          {
                            user.email
                          }
                        </td>

                        <td>
                          {
                            user.department
                          }
                        </td>

                        <td>
                          <span
                            className={
                              user.role ===
                              "Admin"
                                ? "user-role admin"
                                : "user-role normal-user"
                            }
                          >
                            {
                              user.role
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              user.status ===
                              "Active"
                                ? "user-status active"
                                : "user-status inactive"
                            }
                          >
                            {
                              user.status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="user-action-buttons">
                            <button
                              type="button"
                              className="user-edit-button"
                              onClick={() =>
                                openEditModal(
                                  user
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                user.status ===
                                "Active"
                                  ? "user-deactivate-button"
                                  : "user-activate-button"
                              }
                              disabled={
                                processingId ===
                                  user.id ||
                                isCurrentUser(
                                  user
                                )
                              }
                              onClick={() =>
                                toggleUserStatus(
                                  user
                                )
                              }
                            >
                              {processingId ===
                              user.id
                                ? "Updating..."
                                : user.status ===
                                    "Active"
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredUsers.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="8"
                          className="users-empty-message"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-footer">
          <span>
            Showing{" "}
            {filteredUsers.length}{" "}
            of {users.length} users
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="user-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="user-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="user-modal-header">
              <div>
                <h3>
                  {editingId
                    ? "Edit User"
                    : "Add New User"}
                </h3>

                <p>
                  {editingId
                    ? "Update the selected user details."
                    : "Enter the details for the new user."}
                </p>
              </div>

              <button
                type="button"
                className="user-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="users-empty-message">
                {errorMessage}
              </div>
            )}

            <form
              className="user-form"
              onSubmit={handleSubmit}
            >
              <div className="user-form-row">
                <div className="user-form-group">
                  <label htmlFor="userId">
                    User ID
                  </label>

                  <input
                    id="userId"
                    type="text"
                    value={formData.code}
                    readOnly
                  />
                </div>

                <div className="user-form-group">
                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="user-form-row">
                <div className="user-form-group">
                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="user-form-group">
                  <label htmlFor="userEmail">
                    Email Address
                  </label>

                  <input
                    id="userEmail"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="user-form-row">
                <div className="user-form-group">
                  <label htmlFor="userPhone">
                    Phone Number
                  </label>

                  <input
                    id="userPhone"
                    name="phone"
                    type="text"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {!editingId && (
                  <div className="user-form-group">
                    <label htmlFor="userPassword">
                      Password
                    </label>

                    <input
                      id="userPassword"
                      name="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="user-form-row">
                <div className="user-form-group">
                  <label htmlFor="department">
                    Department
                  </label>

                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">
                      Select department
                    </option>

                    <option value="Administration">
                      Administration
                    </option>

                    <option value="Accounts">
                      Accounts
                    </option>

                    <option value="Finance Department">
                      Finance Department
                    </option>

                    <option value="IT">
                      IT
                    </option>

                    <option value="Human Resources">
                      Human Resources
                    </option>

                    <option value="Marketing">
                      Marketing
                    </option>
                  </select>
                </div>

                <div className="user-form-group">
                  <label htmlFor="userRole">
                    Role
                  </label>

                  <select
                    id="userRole"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={
                      editingId &&
                      String(
                        getCurrentUserId()
                      ) ===
                        String(
                          editingId
                        )
                    }
                  >
                    <option value="User">
                      User
                    </option>

                    <option value="Admin">
                      Admin
                    </option>
                  </select>
                </div>
              </div>

              <div className="user-form-group">
                <label htmlFor="userStatus">
                  Status
                </label>

                <select
                  id="userStatus"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={
                    editingId &&
                    String(
                      getCurrentUserId()
                    ) ===
                      String(editingId)
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

              <div className="user-modal-actions">
                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-save-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update User"
                      : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Users;